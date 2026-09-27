import { coinflow } from "@/lib/onramp/coinflow";
import { handleWebhook } from "@/lib/onramp/webhook";

export const dynamic = "force-dynamic";

/** Coinflow webhooks. Protected by the Coinflow-Signature HMAC (webhook validation key) only; duplicates are safe. */
export async function POST(req: Request) { return handleWebhook(coinflow, req); }
