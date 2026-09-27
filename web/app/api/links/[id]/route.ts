import { NextResponse } from "next/server";
import { allow } from "@/lib/db";
import { deleteLink, getLink, saveLink } from "@/lib/links";
import { currentWallet, sameOrigin } from "@/lib/session";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "origin" }, { status: 403 });
  const wallet = await currentWallet();
  if (!wallet) return NextResponse.json({ error: "signin" }, { status: 401 });
  const { id } = await params;
  if (!(await getLink(wallet, id))) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await deleteLink(wallet, id);
  return NextResponse.json({ ok: true });
}

/** Link settings. For now: whether card payments are accepted (on by default). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "origin" }, { status: 403 });
  const wallet = await currentWallet();
  if (!wallet) return NextResponse.json({ error: "signin" }, { status: 401 });
  if (!(await allow(`patch:${wallet}`, 30, 60))) return NextResponse.json({ error: "slow_down" }, { status: 429 });
  const { id } = await params;
  const link = await getLink(wallet, id);
  if (!link) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { card?: unknown };
  if (typeof body.card !== "boolean") return NextResponse.json({ error: "invalid" }, { status: 400 });
  link.card = body.card;
  await saveLink(link, false);
  return NextResponse.json({ link });
}
