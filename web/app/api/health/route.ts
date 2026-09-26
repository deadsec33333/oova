import { NextResponse } from "next/server";
import { rpc } from "@/lib/rpc";

export const dynamic = "force-dynamic";

/** Which pieces are configured. Booleans only, never values. */
export async function GET() {
  const has = (k: string) => Boolean(process.env[k]);
  let rpcOk = false;
  if (has("SOLANA_RPC")) { try { await rpc<number>("getSlot", []); rpcOk = true; } catch { rpcOk = false; } }
  return NextResponse.json({
    solanaRpc: has("SOLANA_RPC"),
    solanaRpcReachable: rpcOk,
    database: has("KV_REST_API_URL") || has("UPSTASH_REDIS_REST_URL"),
    authSecret: has("AUTH_SECRET"),
    google: has("AUTH_GOOGLE_ID") && has("AUTH_GOOGLE_SECRET"),
    email: has("AUTH_RESEND_KEY"),
  }, { headers: { "cache-control": "no-store" } });
}
