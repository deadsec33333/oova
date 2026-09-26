import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { allow, dbConfig, redis } from "@/lib/db";
import { sameOrigin } from "@/lib/session";
import { signInMessage } from "@/lib/siws";
import { isSolanaAddress } from "@/lib/solanapay";

export const dynamic = "force-dynamic";

/** Step 1 of wallet sign in: the server writes the exact message to sign. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "origin" }, { status: 403 });
  if (!dbConfig() || !process.env.AUTH_SECRET) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const { wallet } = (await req.json().catch(() => ({}))) as { wallet?: string };
  if (!wallet || !isSolanaAddress(wallet)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "anon";
  if (!(await allow(`nonce:${ip}`, 20, 60))) return NextResponse.json({ error: "slow_down" }, { status: 429 });

  const host = new URL(req.url).host;
  const nonce = randomBytes(12).toString("hex");
  const message = signInMessage(host, wallet, nonce, new Date());
  await redis("SET", `nonce:${nonce}`, JSON.stringify({ wallet, message }), "EX", 300);
  return NextResponse.json({ message }, { headers: { "cache-control": "no-store" } });
}
