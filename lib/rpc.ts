/** Minimal Solana JSON-RPC client. Server only: the key lives in SOLANA_RPC and never reaches the browser. */
import "server-only";

export type Network = "mainnet" | "devnet";

/** Devnet is only used for provider sandboxes (test money). SOLANA_RPC_DEVNET overrides the public endpoint. */
export async function rpc<T>(method: string, params: unknown[], network: Network = "mainnet"): Promise<T> {
  const url = network === "devnet" ? process.env.SOLANA_RPC_DEVNET || "https://api.devnet.solana.com" : process.env.SOLANA_RPC;
  if (!url) throw new Error("rpc_not_configured");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    const json = (await res.json()) as { result?: T; error?: { message: string } };
    if (json.error) throw new Error(json.error.message);
    return json.result as T;
  } finally {
    clearTimeout(t);
  }
}
