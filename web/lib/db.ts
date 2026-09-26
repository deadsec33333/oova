import "server-only";

/** Find Upstash REST creds under any prefix the Vercel integration used. */
function pick(suffixes: string[]): string | undefined {
  for (const s of suffixes) if (process.env[s]) return process.env[s];
  for (const [k, v] of Object.entries(process.env)) {
    if (v && suffixes.some((s) => k.endsWith("_" + s))) return v;
  }
  return undefined;
}

export function dbConfig() {
  const url = pick(["KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"]);
  const token = pick(["KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN"]);
  return url && token ? { url, token } : null;
}

/** Run one Redis command over the Upstash REST API. */
export async function redis<T = unknown>(...cmd: (string | number)[]): Promise<T> {
  const cfg = dbConfig();
  if (!cfg) throw new Error("db_not_configured");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { authorization: `Bearer ${cfg.token}`, "content-type": "application/json" },
      body: JSON.stringify(cmd),
      cache: "no-store",
      signal: ctrl.signal,
    });
    const json = await res.json();
    if (json.error) throw new Error("db_error");
    return json.result as T;
  } finally {
    clearTimeout(t);
  }
}

/** Several commands in one round trip. Returns each result in order. */
export async function pipeline(cmds: (string | number)[][]): Promise<unknown[]> {
  const cfg = dbConfig();
  if (!cfg) throw new Error("db_not_configured");
  if (!cmds.length) return [];
  const res = await fetch(cfg.url.replace(/\/$/, "") + "/pipeline", {
    method: "POST",
    headers: { authorization: `Bearer ${cfg.token}`, "content-type": "application/json" },
    body: JSON.stringify(cmds),
    cache: "no-store",
  });
  const json = (await res.json()) as { result?: unknown; error?: string }[];
  if (!Array.isArray(json)) throw new Error("db_error");
  return json.map((r) => (r.error ? null : r.result));
}

/** Fixed window rate limit. True when the caller is still under the limit. */
export async function allow(key: string, max: number, windowSec: number): Promise<boolean> {
  const k = `rl:${key}`;
  const [, n] = (await pipeline([["SET", k, 0, "EX", windowSec, "NX"], ["INCR", k]])) as [unknown, number];
  return typeof n === "number" && n <= max;
}
