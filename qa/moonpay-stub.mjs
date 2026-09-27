// Local stand in for the MoonPay API, buy widget and webhooks. TEST ONLY, never deploy.
import http from "node:http";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const env = (k, d) => process.env[k] || d;
const PORT = Number(env("PORT", 8898));
const MP_SECRET = env("MP_SECRET", "sk_test_local");
const MP_WEBHOOK_KEY = env("MP_WEBHOOK_KEY", "wk_test_local");
const WEBHOOK_URL = env("WEBHOOK_URL", "http://localhost:3000/api/onramp/moonpay");
const RPC_CTL = env("RPC_CTL", "http://127.0.0.1:8899");
const MP_HOT_WALLET = env("MP_HOT_WALLET", "MoonPayHotWa11et1111111111111111111111111111");

const COUNTRIES = { PH: ["PHL", "Philippines"], US: ["USA", "United States"], LT: ["LTU", "Lithuania"], GB: ["GBR", "United Kingdom"], DE: ["DEU", "Germany"], NG: ["NGA", "Nigeria"], IN: ["IND", "India"] };
const fresh = () => ({ country: { alpha2: "PH", buy: true }, limits: { baseMin: 20, quoteMin: 15 }, txs: [], webhooks: [], calls: {} });
let S = fresh();

const r2 = (x) => Math.round(x * 100) / 100;
const iso = (ms = Date.now()) => new Date(ms).toISOString();
const count = (k) => (S.calls[k] = (S.calls[k] || 0) + 1);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const readBody = (req) => new Promise((r) => { let s = ""; req.on("data", (d) => (s += d)); req.on("end", () => { try { r(s ? JSON.parse(s) : {}); } catch { r({}); } }); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function quote(code, amount, baseCode = "usd", paymentMethod = "credit_debit_card") {
  const base = r2(amount), fee = r2(Math.max(3.99, base * 0.045)), net = 0.01;
  return { baseCurrencyCode: baseCode, quoteCurrencyCode: code, baseCurrencyAmount: base, quoteCurrencyAmount: Number(amount), quoteCurrencyPrice: 1,
    feeAmount: fee, networkFeeAmount: net, extraFeeAmount: 0, extraFeePercentage: 0, totalAmount: r2(base + fee + net), paymentMethod,
    expiresIn: 30, expiresAt: iso(Date.now() + 30_000) };
}

// Mirrors MoonPay: HMAC SHA256 (base64) over url.search with the trailing signature param removed.
function checkSig(search) {
  const m = search.match(/[?&]signature=([^&]*)$/);
  if (!m) return false;
  const msg = search.slice(0, m.index) || "?";
  const want = Buffer.from(createHmac("sha256", MP_SECRET).update(msg).digest("base64"));
  let got; try { got = Buffer.from(decodeURIComponent(m[1])); } catch { return false; }
  return got.length === want.length && timingSafeEqual(got, want);
}

async function sendWebhook(type, tx, { rawBody, badSig = false } = {}) {
  const body = rawBody ?? JSON.stringify({ type, data: tx, externalCustomerId: null });
  const t = Math.floor(Date.now() / 1000);
  const s = createHmac("sha256", badSig ? MP_WEBHOOK_KEY + "_wrong" : MP_WEBHOOK_KEY).update(`${t}.${body}`).digest("hex");
  const t0 = Date.now(); let status = 0;
  try {
    const r = await fetch(WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json", "Moonpay-Signature-V2": `t=${t},s=${s}` }, body });
    status = r.status; await r.text();
  } catch (e) { console.log(`[moonpay-stub] webhook ${type} -> error ${e.cause?.code || e.message}`); }
  const ms = Date.now() - t0;
  console.log(`[moonpay-stub] webhook ${type}${badSig ? " (bad sig)" : ""} -> ${status} in ${ms}ms`);
  S.webhooks.push({ type, status, ms }); if (S.webhooks.length > 50) S.webhooks.shift();
  return status;
}
const hook = async (on, dup, type, tx) => { if (!on) return; const snap = structuredClone(tx); await sendWebhook(type, snap); if (dup) await sendWebhook(type, snap); };

function makeTx(ext, wallet, amount) {
  const q = quote("usdc_sol", Number(amount)), at = iso();
  return { id: randomUUID(), createdAt: at, updatedAt: at, status: "pending", baseCurrencyAmount: q.baseCurrencyAmount, quoteCurrencyAmount: q.quoteCurrencyAmount,
    feeAmount: q.feeAmount, extraFeeAmount: 0, networkFeeAmount: q.networkFeeAmount, areFeesIncluded: false, paymentMethod: "credit_debit_card", failureReason: null,
    walletAddress: wallet, cryptoTransactionId: null, currencyId: "usdc_sol_id", currency: { code: "usdc_sol" }, baseCurrency: { code: "usd" },
    externalTransactionId: ext, externalCustomerId: null, country: "PH" };
}
const setStatus = (tx, status, extra = {}) => Object.assign(tx, { status, updatedAt: iso(), ...extra });

async function finish(tx, mode, o) {
  if (mode === "decline") { setStatus(tx, "failed", { failureReason: "Card declined" }); return hook(o.webhook, o.duplicate, "transaction_failed", tx); }
  const full = Math.round(Number(tx.quoteCurrencyAmount) * 1e6);
  const r = await fetch(`${RPC_CTL}/__pay`, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ ref: "card-" + tx.externalTransactionId, to: tx.walletAddress, raw: mode === "short" ? Math.round(full * 0.5) : full, payer: MP_HOT_WALLET, blockTime: Math.floor(Date.now() / 1000) }) });
  const j = await r.json();
  if (!j.ok || !j.sig) throw new Error("RPC stand in /__pay failed: " + JSON.stringify(j));
  setStatus(tx, "completed", { cryptoTransactionId: j.sig });
  await hook(o.webhook, o.duplicate, "transaction_updated", tx);
}

async function widgetPay(b) {
  const o = { webhook: b.webhook !== false, duplicate: !!b.duplicate }, delay = Number(b.delayMs) || 0;
  if (!b.ext || !b.wallet || !(Number(b.amount) > 0)) return [400, { message: "ext, wallet and positive amount required" }];
  const tx = makeTx(b.ext, b.wallet, b.amount); S.txs.push(tx);
  const run = async () => { await hook(o.webhook, o.duplicate, "transaction_created", tx); await hook(o.webhook, o.duplicate, "transaction_updated", tx); if (delay) await sleep(delay); await finish(tx, b.mode || "ok", o); };
  if (delay) { run().catch((e) => console.log("[moonpay-stub] delayed pay error:", e.message)); return [200, { id: tx.id, status: tx.status }]; }
  await run();
  return [200, { id: tx.id, status: tx.status }];
}

function widgetPage(search) {
  const p = new URLSearchParams(search), ok = checkSig(search);
  const f = (k) => p.get(k) ?? "";
  const cfg = JSON.stringify({ ext: f("externalTransactionId"), wallet: f("walletAddress"), amount: Number(f("quoteCurrencyAmount")), redirect: f("redirectURL") }).replace(/</g, "\\u003c");
  const row = (label, val, id) => `<tr><th>${label}</th><td${id ? ` id="${id}"` : ""}>${esc(val)}</td></tr>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MoonPay stand in</title>
<style>body{font:15px/1.5 system-ui,sans-serif;background:#f4f2fb;color:#1b1530;margin:0;padding:24px}main{max-width:440px;margin:auto;background:#fff;border-radius:14px;padding:20px;box-shadow:0 4px 20px #0001}
h1{font-size:18px;margin:0 0 4px}.sig{font-weight:700}.ok{color:#137a3a}.invalid{color:#b3261e}table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13px}th{text-align:left;color:#666;padding:4px 8px 4px 0;white-space:nowrap}td{word-break:break-all}
input{width:100%;box-sizing:border-box;padding:8px;border:1px solid #ccc;border-radius:8px;background:#f7f7f7;font:12px monospace}button{display:block;width:100%;padding:12px;margin-top:8px;border:0;border-radius:10px;font-size:15px;cursor:pointer;background:#7d00ff;color:#fff}
button#decline{background:#b3261e}button#short{background:#a36b00}button:disabled{background:#bbb;cursor:not-allowed}</style></head><body><main>
<h1>MoonPay sandbox stand in</h1><div>Signature: <span id="sig" class="sig ${ok ? "ok" : "invalid"}">${ok ? "ok" : "invalid"}</span></div>
<table>${row("currencyCode", f("currencyCode"))}${row("quoteCurrencyAmount", f("quoteCurrencyAmount"), "amount")}${row("baseCurrencyCode", f("baseCurrencyCode"))}${row("externalTransactionId", f("externalTransactionId"))}${row("redirectURL", f("redirectURL"))}</table>
<label>walletAddress<input id="wallet" readonly value="${esc(f("walletAddress"))}"></label>
<button id="pay"${ok ? "" : " disabled"}>Pay with test card</button><button id="decline"${ok ? "" : " disabled"}>Decline card</button><button id="short"${ok ? "" : " disabled"}>Pay but deliver less</button>
<p id="msg" style="font-size:13px;color:#666"></p></main><script>
const C=${cfg};
async function go(mode){document.querySelectorAll("button").forEach(b=>b.disabled=true);document.getElementById("msg").textContent="Processing "+mode+"...";
 const r=await fetch("/__widget_pay",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({ext:C.ext,wallet:C.wallet,amount:C.amount,mode})});
 const j=await r.json();if(!r.ok){document.getElementById("msg").textContent="Error: "+(j.message||r.status);return}
 if(!C.redirect){document.getElementById("msg").textContent="Done: "+j.status;return}
 location.href=C.redirect+(C.redirect.includes("?")?"&":"?")+"transactionId="+encodeURIComponent(j.id)+"&transactionStatus="+encodeURIComponent(j.status)}
for(const m of ["pay","decline","short"])document.getElementById(m).onclick=()=>go(m==="pay"?"ok":m);
</script></body></html>`;
}

http.createServer(async (req, res) => {
  const qi = req.url.indexOf("?"), path = qi < 0 ? req.url : req.url.slice(0, qi), search = qi < 0 ? "" : req.url.slice(qi);
  const q = new URLSearchParams(search);
  const send = (code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
  try {
    const b = req.method === "POST" ? await readBody(req) : {};
    let m;
    if (req.method === "GET" && path === "/v3/ip_address") {
      count("ip_address"); const { alpha2, buy } = S.country; const [alpha3, country] = COUNTRIES[alpha2] || [alpha2 + "X", alpha2];
      return send(200, { alpha2, alpha3, country, state: "", ipAddress: q.get("ipAddress") || req.socket.remoteAddress, isAllowed: buy, isBuyAllowed: buy, isSellAllowed: buy, isNftAllowed: true });
    }
    if (req.method === "GET" && (m = path.match(/^\/v3\/currencies\/([^/]+)\/limits$/))) {
      count("limits");
      return send(200, { baseCurrency: { code: q.get("baseCurrencyCode") || "usd", minBuyAmount: S.limits.baseMin, maxBuyAmount: 10000 }, quoteCurrency: { code: m[1], minBuyAmount: S.limits.quoteMin, maxBuyAmount: 9500 }, paymentMethod: "credit_debit_card" });
    }
    if (req.method === "GET" && (m = path.match(/^\/v3\/currencies\/([^/]+)\/buy_quote$/))) {
      count("buy_quote"); const amt = Number(q.get("quoteCurrencyAmount"));
      if (!q.get("quoteCurrencyAmount") || !(amt > 0)) return send(400, { message: "quoteCurrencyAmount is required and must be a positive number" });
      return send(200, quote(m[1], amt, q.get("baseCurrencyCode") || "usd", q.get("paymentMethod") || "credit_debit_card"));
    }
    if (req.method === "GET" && (m = path.match(/^\/v1\/transactions\/ext\/([^/]+)$/))) {
      count("transactions_ext"); const list = S.txs.filter((t) => t.externalTransactionId === decodeURIComponent(m[1]));
      return list.length ? send(200, list) : send(404, { message: "Transaction not found" });
    }
    if (req.method === "GET" && path === "/widget") { count("widget"); res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return res.end(widgetPage(search)); }
    if (req.method === "GET" && path === "/__calls") return send(200, S.calls);
    if (req.method === "GET" && path === "/__webhooks") return send(200, S.webhooks);
    if (req.method !== "POST") return send(404, { message: "Not found" });
    if (path === "/__country") { S.country = { alpha2: String(b.alpha2 || "PH").toUpperCase(), buy: b.buy !== false }; return send(200, S.country); }
    if (path === "/__limits") { S.limits = { baseMin: Number(b.baseMin ?? 20), quoteMin: Number(b.quoteMin ?? 15) }; return send(200, S.limits); }
    if (path === "/__reset") { S = fresh(); return send(200, { ok: true }); }
    if (path === "/__widget_pay") { count("widget_pay"); const [code, out] = await widgetPay(b); return send(code, out); }
    if (path === "/__complete") {
      const tx = S.txs.findLast((t) => t.externalTransactionId === b.ext); if (!tx) return send(404, { message: "Transaction not found" });
      setStatus(tx, b.status || "completed", { ...(b.cryptoTransactionId !== undefined && { cryptoTransactionId: b.cryptoTransactionId }), ...(b.status === "failed" && { failureReason: b.failureReason || "Forced failure" }) });
      await hook(b.webhook !== false, false, tx.status === "failed" ? "transaction_failed" : "transaction_updated", tx);
      return send(200, tx);
    }
    if (path === "/__webhook_raw") {
      const raw = typeof b.body === "string" ? b.body : JSON.stringify(b.body ?? {});
      const status = await sendWebhook(b.body?.type || "raw", null, { rawBody: raw, badSig: b.badSig !== false });
      return send(200, { status });
    }
    send(404, { message: "Not found" });
  } catch (e) { console.log("[moonpay-stub] error:", e.message); send(500, { message: e.message }); }
}).listen(PORT, () => console.log(`moonpay stub up on ${PORT} (TEST ONLY) webhooks -> ${WEBHOOK_URL}`));
