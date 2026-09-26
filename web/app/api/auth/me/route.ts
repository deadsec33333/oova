import { NextResponse } from "next/server";
import { dbConfig } from "@/lib/db";
import { currentWallet } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const ready = Boolean(dbConfig() && process.env.AUTH_SECRET);
  const wallet = ready ? await currentWallet() : null;
  return NextResponse.json({ wallet, ready }, { headers: { "cache-control": "no-store" } });
}
