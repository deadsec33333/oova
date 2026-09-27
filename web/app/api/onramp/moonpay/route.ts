import { moonpay } from "@/lib/onramp/moonpay";
import { handleWebhook } from "@/lib/onramp/webhook";

export const dynamic = "force-dynamic";

/** MoonPay webhooks. Protected by the Moonpay-Signature-V2 signature only; duplicates and out of order events are safe. */
export async function POST(req: Request) { return handleWebhook(moonpay, req); }
