import { NextResponse } from "next/server";
import { allow } from "@/lib/db";
import { getLink, saveLink } from "@/lib/links";
import { checkPayment } from "@/lib/paycheck";
import { currentWallet, sameOrigin } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Look on Solana for this link's payment and remember it once found. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "origin" }, { status: 403 });
  const wallet = await currentWallet();
  if (!wallet) return NextResponse.json({ error: "signin" }, { status: 401 });
  const { id } = await params;
  const link = await getLink(wallet, id);
  if (!link) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (link.status === "paid") return NextResponse.json({ link });
  if (!(await allow(`check:${wallet}`, 90, 60))) return NextResponse.json({ link });
  try {
    const r = await checkPayment(link.to, link.amount, link.ref);
    if (r.status === "paid") {
      link.status = "paid";
      link.paid = { signature: r.signature, payer: r.payer, blockTime: r.blockTime, exact: r.exact };
      await saveLink(link, false);
    }
    return NextResponse.json({ link }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ link, error: "rpc" }, { status: 502 });
  }
}
