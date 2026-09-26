import { NextResponse } from "next/server";
import { deleteLink, getLink } from "@/lib/links";
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
