// TEST ONLY stand in for the Coinflow API and hosted checkout. Port 8897.
import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT || 8897);
const API_KEY = process.env.CF_API_KEY || "ck_test_local";
const WH_KEY = process.env.CF_WEBHOOK_KEY || "wk_cf_local";
const WEBHOOK_URL = process.env.CF_WEBHOOK_URL || "http://localhost:3000/api/onramp/coinflow";
const RPC_CTL = process.env.RPC_CTL || "http://127.0.0.1:8899";
const HOT = "CoinF1owHotWa11et11111111111111111111111111";

const checkouts = new Map(); // id -> {body, userId}
const payments = new Map(); // paymentId -> {paymentId, signature, error, webhookInfo}
const hooks = []; const calls = {};
const body = (req) => new Promise((r) => { let s = ""; req.on("data", (d) => (s += d)); req.on("end", () => { try { r(s ? JSON.parse(s) : {}); } catch { r({}); } }); });
const send = (res, code, obj, type = "application/json") => { res.writeHead(code, { "content-type": type }); res.end(type === "application/json" ? JSON.stringify(obj) : obj); };
const dakOf = (w) => Buffer.from(JSON.stringify({ destination: w })).toString("base64url");
const walletOf = (dak) => { try { return JSON.parse(Buffer.from(dak, "base64url").toString()).destination; } catch { return null; } };

async function webhook(eventType, data, { bad = false } = {}) {
  const raw = JSON.stringify({ eventType, category: "Purchase", created: new Date().toISOString(), data });
  const t = Math.floor(Date.now() / 1000);
  const v1 = crypto.createHmac("sha256", bad ? "wrong" : WH_KEY).update(`${t}.${raw}`).digest("hex");
  const t0 = Date.now();
  let status = 0;
  try { status = (await fetch(WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json", "Coinflow-Signature": `t=${t},v1=${v1}` }, body: raw })).status; } catch { /* down */ }
  hooks.push({ eventType, status, ms: Date.now() - t0 }); if (hooks.length > 50) hooks.shift();
  return status;
}

function totals(cents) {
  const card = Math.round(cents * 0.029) + 30, cbp = Math.round(cents * 0.01), gas = 1;
  const cc = (n) => ({ cents: n, currency: "USD" });
  return { subtotal: cc(cents), creditCardFees: cc(card), chargebackProtectionFees: cc(cbp), gasFees: cc(gas), fxFees: cc(0), networkFees: cc(0), payInFees: cc(0), total: cc(cents + card + cbp + gas), settlement: { subtotal: cc(cents) } };
}

async function pay(id, mode, { webhooks = true, duplicate = false, disbursedOnly = false } = {}) {
  const co = checkouts.get(id); if (!co) return { error: "no checkout" };
  const paymentId = "pay_" + crypto.randomBytes(8).toString("hex");
  const wallet = walletOf(co.body.destinationAuthKey);
  const cents = co.body.subtotal.cents;
  const info = co.body.webhookInfo;
  const base = { id: paymentId, wallet: "customer-wallet", webhookInfo: info, subtotal: { cents }, fees: { cents: 0 }, gasFees: { cents: 1 }, chargebackProtectionFees: { cents: 0 }, fxFees: { cents: 0 }, total: { cents }, merchantId: "qova-test", presentmentTotals: {}, settlementTotals: {} };
  const hook = async (ev, d) => { if (!webhooks) return; await webhook(ev, d); if (duplicate) await webhook(ev, d); };
  payments.set(paymentId, { paymentId, webhookInfo: info });
  if (mode === "decline") {
    payments.get(paymentId).error = "Card declined";
    await hook("Card Payment Declined", { ...base, declineCode: "05", declineDescription: "Card declined" });
    return { paymentId, status: "declined" };
  }
  await hook("Card Payment Authorized", base);
  const raw = mode === "short" ? cents * 5000 : cents * 10000;
  const r = await fetch(RPC_CTL + "/__pay", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ref: "cf-" + id, to: wallet, raw, payer: HOT, blockTime: Math.floor(Date.now() / 1000) }) }).then((x) => x.json());
  payments.get(paymentId).signature = r.sig;
  if (disbursedOnly) { if (webhooks) await webhook("Disbursed Funds", { id: paymentId, merchantId: "qova-test", signature: r.sig, settlementType: "USDC", blockchain: "solana", amount: { cents, currency: "USD" }, disbursedAt: new Date().toISOString() }); }
  else await hook("Settled", { ...base, signature: r.sig });
  return { paymentId, status: "settled", signature: r.sig };
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  const p = u.pathname;
  calls[p.replace(/\/[A-Za-z0-9_-]{12,}$/, "/:id")] = (calls[p] || 0) + 1;
  const auth = req.headers.authorization;
  // ---- API ----
  if (p === "/api/checkout/destination-auth-key" && req.method === "POST") {
    if (auth !== API_KEY) return send(res, 401, { message: "unauthorized" });
    const b = await body(req); if (!b.destination || b.blockchain !== "solana") return send(res, 400, { message: "bad" });
    return send(res, 200, { destinationAuthKey: dakOf(b.destination) });
  }
  if (p === "/api/auth/session-key" && req.method === "GET") {
    if (auth !== API_KEY || !req.headers["x-coinflow-auth-user-id"]) return send(res, 401, { message: "unauthorized" });
    return send(res, 200, { key: "sess-" + req.headers["x-coinflow-auth-user-id"] });
  }
  if (p.startsWith("/api/checkout/totals/") && req.method === "POST") {
    if (!String(req.headers["x-coinflow-auth-session-key"] || "").startsWith("sess-")) return send(res, 401, { message: "unauthorized" });
    const b = await body(req); const cents = b.subtotal?.cents;
    if (!Number.isInteger(cents) || cents < 1) return send(res, 400, { message: "bad subtotal" });
    if (b.settlementType !== "USDC" || !walletOf(b.destinationAuthKey)) return send(res, 400, { message: "bad settlement" });
    const t = totals(cents);
    return send(res, 200, { card: t, applePay: t, googlePay: t, ach: t });
  }
  if (p === "/api/checkout/link" && req.method === "POST") {
    if (auth !== API_KEY) return send(res, 401, { message: "unauthorized" });
    const b = await body(req);
    const bad = !b.email ? "email" : !walletOf(b.destinationAuthKey) ? "destinationAuthKey" : b.settlementType !== "USDC" ? "settlementType" : b.blockchain !== "solana" ? "blockchain" : !b.subtotal?.cents ? "subtotal" : !b.webhookInfo?.qovaOrder ? "webhookInfo" : null;
    if (bad) return send(res, 400, { message: `missing ${bad}` });
    const id = crypto.randomBytes(9).toString("base64url");
    checkouts.set(id, { body: b, userId: req.headers["x-coinflow-auth-user-id"] });
    return send(res, 200, { link: `http://localhost:${PORT}/checkout/${id}` });
  }
  if (p === "/api/merchant" && req.method === "GET") {
    if (auth !== API_KEY) return send(res, 401, { message: "unauthorized" });
    return send(res, 200, { merchantId: "qova-test" });
  }
  const pm = p.match(/^\/api\/merchant\/payments\/([^/]+)$/);
  if (pm && req.method === "GET") {
    if (auth !== API_KEY) return send(res, 401, { message: "unauthorized" });
    const x = payments.get(pm[1]); if (!x) return send(res, 404, { message: "not found" });
    return send(res, 200, { ...x, createdAt: new Date().toISOString() });
  }
  // ---- hosted checkout page ----
  const cm = p.match(/^\/checkout\/([A-Za-z0-9_-]+)$/);
  if (cm && req.method === "GET") {
    const co = checkouts.get(cm[1]); if (!co) return send(res, 404, "not found", "text/html");
    const b = co.body, w = walletOf(b.destinationAuthKey), t = totals(b.subtotal.cents);
    const cb = b.standaloneLinkConfig?.callbackUrl || "";
    return send(res, 200, `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><title>Coinflow checkout (stand in)</title>
<style>body{font:15px system-ui;margin:0;padding:24px;background:#f5f5f7;color:#111}main{max-width:420px;margin:auto;background:#fff;border-radius:20px;padding:22px;box-shadow:0 10px 40px rgba(0,0,0,.08)}h1{font-size:18px}.r{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}button{width:100%;min-height:48px;margin-top:10px;border:0;border-radius:12px;font:600 15px system-ui;cursor:pointer}#pay{background:#111;color:#fff}#decline{background:#eee}small{color:#777}</style>
<main><p><small>Coinflow sandbox stand in (local test)</small></p><h1>Pay $${(t.total.cents / 100).toFixed(2)}</h1>
<div class=r><span>Email</span><b id=email>${b.email}</b></div>
<div class=r><span>USDC to</span><b id=dest style="font:12px monospace;word-break:break-all">${w}</b></div>
<div class=r><span>Subtotal</span><b id=subtotal>${(b.subtotal.cents / 100).toFixed(2)}</b></div>
<div class=r><span>Settlement</span><b id=settle>${b.settlementType} on ${b.blockchain}</b></div>
<button id=pay>Pay with test card 4242</button><button id=decline>Decline card</button></main>
<script>async function go(mode){const r=await fetch('/__pay_checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:${JSON.stringify(cm[1])},mode})}).then(r=>r.json());if(mode==='ok'&&${JSON.stringify(cb)})location.href=${JSON.stringify(cb)}+(${JSON.stringify(cb)}.includes('?')?'&':'?')+'paymentId='+r.paymentId;else document.body.insertAdjacentHTML('beforeend','<p id=done>'+r.status+'</p>')}
document.getElementById('pay').onclick=()=>go('ok');document.getElementById('decline').onclick=()=>go('decline');</script>`, "text/html");
  }
  // ---- controls ----
  if (p === "/__pay_checkout" && req.method === "POST") { const b = await body(req); return send(res, 200, await pay(b.id, b.mode || "ok", b)); }
  if (p === "/__checkouts") return send(res, 200, [...checkouts.entries()].map(([id, c]) => ({ id, ...c })));
  if (p === "/__webhooks") return send(res, 200, hooks);
  if (p === "/__calls") return send(res, 200, calls);
  if (p === "/__webhook_raw" && req.method === "POST") { const b = await body(req); return send(res, 200, { status: await webhook(b.eventType || "Settled", b.data || { id: "x" }, { bad: b.bad !== false }) }); }
  send(res, 404, { message: "no route" });
}).listen(PORT, () => console.log("coinflow stub on", PORT));
