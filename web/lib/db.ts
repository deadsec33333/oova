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
