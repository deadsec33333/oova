import { NextResponse } from "next/server";
import { pipeline, redis } from "@/lib/db";
import { SESSION_COOKIE, cookieOptions, sameOrigin, signSession } from "@/lib/session";
import { verifySignature } from "@/lib/siws";

export const dynamic = "force-dynamic";

/** Step 2: check the signed message, then start a session. Nonces work once. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "origin" }, { status: 403 });
  const { wallet, message, signature } = (await req.json().catch(() => ({}))) as { wallet?: string; message?: string; signature?: string };
  if (!wallet || !message || !signature) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const nonce = /^Nonce: ([0-9a-f]{24})$/m.exec(message)?.[1];
  if (!nonce) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const raw = await redis<string | null>("GETDEL", `nonce:${nonce}`);
  if (!raw) return NextResponse.json({ error: "expired" }, { status: 401 });
  const saved = JSON.parse(raw) as { wallet: string; message: string };
  if (saved.wallet !== wallet || saved.message !== message) return NextResponse.json({ error: "mismatch" }, { status: 401 });
  if (!verifySignature(wallet, message, signature)) return NextResponse.json({ error: "bad_signature" }, { status: 401 });

  const now = Date.now();
  await pipeline([["HSETNX", `user:${wallet}`, "createdAt", now], ["HSET", `user:${wallet}`, "lastSeen", now]]);
  const res = NextResponse.json({ wallet });
  res.cookies.set(SESSION_COOKIE, signSession(wallet), cookieOptions);
  return res;
}
