import { NextResponse } from "next/server";
import { rpc } from "@/lib/rpc";
import { dbConfig, redis } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Which pieces are configured. Booleans only, never values. */
export async function GET() {
  const has = (k: string) => Boolean(process.env[k]);
  let rpcOk = false;
  if (has("SOLANA_RPC")) { try { await rpc<number>("getSlot", []); rpcOk = true; } catch { rpcOk = false; } }
  const db = Boolean(dbConfig());
  let dbOk = false;
  if (db) { try { dbOk = (await redis<string>("PING")) === "PONG"; } catch { dbOk = false; } }
  return NextResponse.json({
    solanaRpc: has("SOLANA_RPC"),
    solanaRpcReachable: rpcOk,
    database: db,
    databaseReachable: dbOk,
    authSecret: has("AUTH_SECRET"),
    google: has("AUTH_GOOGLE_ID") && has("AUTH_GOOGLE_SECRET"),
    email: has("AUTH_RESEND_KEY"),
  }, { headers: { "cache-control": "no-store" } });
}
