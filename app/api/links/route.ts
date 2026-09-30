import { NextResponse } from "next/server";
import { allow, redis } from "@/lib/db";
import { listLinks, newLinkId, saveLink, type LinkRec } from "@/lib/links";
import { currentWallet, sameOrigin } from "@/lib/session";
import { cleanText, isSolanaAddress, newReference, parseAmount } from "@/lib/solanapay";

export const dynamic = "force-dynamic";
const noStore = { headers: { "cache-control": "no-store" } };

export async function GET() {
  const wallet = await currentWallet();
  if (!wallet) return NextResponse.json({ error: "signin" }, { status: 401 });
  return NextResponse.json({ links: await listLinks(wallet) }, noStore);
}

/** Save a new pay link. Money always goes to the signed in wallet. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "origin" }, { status: 403 });
  const wallet = await currentWallet();
  if (!wallet) return NextResponse.json({ error: "signin" }, { status: 401 });
  if (!(await allow(`links:${wallet}`, 30, 60))) return NextResponse.json({ error: "slow_down" }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as { amount?: string; label?: string; message?: string; ref?: string; createdAt?: number };
  const amount = parseAmount(body.amount ?? "");
  if (!amount) return NextResponse.json({ error: "amount" }, { status: 400 });
  // A link made on this device before signing in keeps its reference, so its payment is still found.
  const ref = body.ref && isSolanaAddress(body.ref) ? body.ref : newReference();
  if (!(await redis<string | null>("SET", `ref:${ref}`, wallet, "NX", "EX", 90 * 86400))) return NextResponse.json({ error: "exists" }, { status: 409 });
  const t = Number(body.createdAt);
  const createdAt = body.ref && t > Date.now() - 7 * 86400_000 && t <= Date.now() ? t : Date.now();
  const link: LinkRec = {
    id: newLinkId(), to: wallet, amount,
    label: cleanText(body.label, 60), message: cleanText(body.message, 120),
    ref, createdAt, status: "open",
  };
  await saveLink(link, true);
  return NextResponse.json({ link }, noStore);
}
