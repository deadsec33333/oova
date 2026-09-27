import { chromium, makeWallet, newContext, signIn, api, BASE } from "./lib.mjs";
const MP = "http://127.0.0.1:8898";
const mp = (path, body) => fetch(MP + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) }).then((r) => r.json());
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const w = makeWallet(); const ctx = await newContext(b, w, { width: 390 }); const p = await ctx.newPage();
await signIn(p);
const res = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"} ${n} ${x}`);
async function start(amount, msg) {
  const l = (await api(p, "/api/links", { amount, message: msg })).json.link;
  const s = await fetch(BASE + "/api/pay/card/session", { method: "POST", headers: { origin: BASE, "content-type": "application/json" }, body: JSON.stringify({ to: l.to, amount: l.amount, ref: l.ref }) }).then((r) => r.json());
  return { l, s };
}
const linkNow = async (id) => (await api(p, "/api/links", null, "GET")).json.links.find((x) => x.id === id);
const status = (o) => fetch(`${BASE}/api/pay/card/status?o=${o}`).then((r) => r.json());
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// A: webhook path through the widget
{ const { l, s } = await start("25", "Webhook path");
  const wp = await ctx.newPage(); await wp.goto(s.url); await wp.click("#pay"); await wait(2500);
  const L = await linkNow(l.id); ok("webhook marks Paid by card", L.status === "paid" && L.paid.method === "card" && L.paid.orderId === s.order, JSON.stringify(L.paid));
  ok("status route says paid", (await status(s.order)).status === "paid"); }
// B: no webhook, status polling fallback
{ const { l, s } = await start("30", "Polling path");
  await mp("/__widget_pay", { ext: s.order, wallet: l.to, amount: 30, mode: "ok", webhook: false });
  let L = await linkNow(l.id); ok("no webhook: still open", L.status === "open");
  const st = await status(s.order); ok("status fallback confirms on chain", st.status === "paid", JSON.stringify(st)); }
// C: fallback through the dashboard watcher (/check)
{ const { l, s } = await start("31", "Check path");
  await mp("/__widget_pay", { ext: s.order, wallet: l.to, amount: 31, mode: "ok", webhook: false });
  const c = await api(p, `/api/links/${l.id}/check`); ok("/check picks up card payment", c.json.link?.status === "paid" && c.json.link.paid.method === "card"); }
// D: duplicate webhooks
{ const { l, s } = await start("20", "Dup");
  await mp("/__widget_pay", { ext: s.order, wallet: l.to, amount: 20, mode: "ok", duplicate: true }); await wait(2000);
  const hooks = await fetch(MP + "/__webhooks").then((r) => r.json());
  ok("duplicates accepted, paid once", (await linkNow(l.id)).status === "paid", hooks.slice(-6).map((h) => h.status).join(",")); }
// E: declined card
{ const { l, s } = await start("22", "Declined");
  await mp("/__widget_pay", { ext: s.order, wallet: l.to, amount: 22, mode: "decline" }); await wait(1500);
  const st = await status(s.order); ok("decline -> failed, link open", st.status === "failed" && (await linkNow(l.id)).status === "open", st.failure); }
// F: short delivery
{ const { l, s } = await start("40", "Short");
  await mp("/__widget_pay", { ext: s.order, wallet: l.to, amount: 40, mode: "short" }); await wait(2000);
  const st = await status(s.order); ok("short -> underpaid, link open", st.status === "underpaid" && (await linkNow(l.id)).status === "open", `${st.received}`); }
// G: bad signature and unsigned
{ const r1 = await fetch(BASE + "/api/onramp/moonpay", { method: "POST", body: JSON.stringify({ type: "transaction_updated", data: { id: "x" } }) });
  const r2 = await mp("/__webhook_raw", { body: JSON.stringify({ type: "transaction_updated", data: { id: "x", status: "completed" } }), badSig: true });
  const hooks = await fetch(MP + "/__webhooks").then((r) => r.json());
  ok("unsigned webhook refused", r1.status === 401); ok("bad signature refused", hooks[hooks.length - 1].status === 401); }
// H: provider says completed to another wallet
{ const { l, s } = await start("26", "Wrong wallet");
  await mp("/__widget_pay", { ext: s.order, wallet: "So11111111111111111111111111111111111111112", amount: 26, mode: "ok" }); await wait(2000);
  const st = await status(s.order); ok("other wallet never counts", st.status === "failed" && (await linkNow(l.id)).status === "open", st.failure); }
// I: card off and paid link refuse sessions
{ const { l } = await start("27", "Reuse");
  const q = await fetch(`${BASE}/api/pay/card/quote?${new URLSearchParams({ to: l.to, amount: l.amount, ref: l.ref })}`).then((r) => r.json());
  ok("quote available for open link", q.available === true); }
console.log(res.join("\n"));
await b.close();
