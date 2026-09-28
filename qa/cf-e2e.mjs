// Coinflow card flow end to end: normal card checkout, USDC to the receiver's wallet, Paid everywhere.
import { chromium, makeWallet, newContext, signIn, api, rpcCtl, BASE } from "./lib.mjs";
import fs from "node:fs";
const out = process.argv[2] || "/home/claude/shots/coinflow"; fs.mkdirSync(out, { recursive: true });
const CF = "http://127.0.0.1:8897";
const cf = (path, body) => fetch(CF + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) }).then((r) => r.json());
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const res = []; const errs = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${x ? " · " + x : ""}`);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let ipN = 20;
const payer = async (theme = "light", country = "PH", W = 390, H = 844) => {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, isMobile: W < 800, hasTouch: W < 800, deviceScaleFactor: 2, extraHTTPHeaders: { "x-forwarded-for": `198.51.100.${ipN++}`, "x-vercel-ip-country": country } });
  await ctx.addInitScript((t) => { try { localStorage.setItem("qova-theme", t); } catch {} }, theme);
  const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message)); return { ctx, p };
};
const payUrl = (l) => `${BASE}/pay?${new URLSearchParams({ to: l.to, amount: l.amount, message: l.message, ref: l.ref })}`;

for (const theme of ["light", "dark"]) {
  const recv = makeWallet();
  await rpcCtl("/__balance", { owner: recv.address, raw: 0 }); // receiver has a USDC account
  const rctx = await newContext(b, recv, { width: 1440, height: 900, theme }); const r = await rctx.newPage();
  r.on("pageerror", (e) => errs.push(e.message));
  await signIn(r);
  const l = (await api(r, "/api/links", { amount: "25", message: `Coinflow ${theme}` })).json.link;
  await r.reload({ waitUntil: "networkidle" });
  const { ctx, p } = await payer(theme);
  await p.goto(payUrl(l), { waitUntil: "networkidle" });
  await p.getByRole("tab", { name: /Card or Apple Pay/ }).click();
  await p.locator(".po-quote").waitFor();
  const qt = await p.locator(".po-card").innerText();
  ok(`${theme} quote from Coinflow, no crypto account copy`, qt.includes("Coinflow fee") && qt.includes("No crypto account needed") && qt.includes("25.00 USDC") && qt.includes("QOVA fee"), qt.split("\n").slice(0, 12).join(" | "));
  ok(`${theme} USD only, no currency switch`, (await p.locator(".po-fiat select").count()) === 0);
  ok(`${theme} continue disabled until email`, await p.getByRole("button", { name: /Continue to Coinflow/ }).isDisabled());
  await p.locator(".po-email input").fill("payer@example.com");
  await p.screenshot({ path: `${out}/pay-card-390-${theme}.png`, fullPage: true });
  await p.getByRole("button", { name: /Continue to Coinflow/ }).click();
  await p.waitForURL(/8897\/checkout\//);
  ok(`${theme} checkout pays the receiver's wallet`, (await p.locator("#dest").innerText()) === l.to);
  ok(`${theme} checkout amount is the link amount`, (await p.locator("#subtotal").innerText()) === "25.00" && (await p.locator("#settle").innerText()) === "USDC on solana");
  ok(`${theme} email passed to Coinflow`, (await p.locator("#email").innerText()) === "payer@example.com");
  await p.screenshot({ path: `${out}/checkout-390-${theme}.png` });
  const t0 = Date.now();
  await p.click("#pay");
  await p.waitForURL(/\/pay\/card\?o=.*paymentId=/);
  await p.locator(".cr.is-paid").waitFor({ timeout: 20000 });
  ok(`${theme} return screen Paid by card`, true, `${((Date.now() - t0) / 1000).toFixed(1)} s`);
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${out}/return-paid-390-${theme}.png` });
  await r.locator(".qt").waitFor({ timeout: 25000 });
  ok(`${theme} receiver toast paid by card`, /paid by card/i.test(await r.locator(".qt").first().innerText()));
  await r.waitForTimeout(600);
  await r.locator(".ax-row", { hasText: `Coinflow ${theme}` }).locator(".ax-row-main").click(); await r.waitForTimeout(700);
  ok(`${theme} receipt says Card via Coinflow`, (await r.locator(".ax-receipt").innerText()).includes("Card via Coinflow"));
  await r.screenshot({ path: `${out}/dash-receipt-1440-${theme}.png` });
  await ctx.close(); await rctx.close();
}

// backend and edge cases
{
  const recv = makeWallet(); await rpcCtl("/__balance", { owner: recv.address, raw: 0 });
  const rctx = await newContext(b, recv, { width: 390 }); const r = await rctx.newPage(); await signIn(r);
  const mk = async (amount, message) => (await api(r, "/api/links", { amount, message })).json.link;
  const session = async (l, email = "p@example.com", ip = "198.51.100.200") => fetch(BASE + "/api/pay/card/session", { method: "POST", headers: { origin: BASE, "content-type": "application/json", "x-forwarded-for": ip, "x-vercel-ip-country": "BR" }, body: JSON.stringify({ to: l.to, amount: l.amount, ref: l.ref, email }) }).then(async (x) => ({ status: x.status, ...(await x.json()) }));
  const linkNow = async (id) => (await api(r, "/api/links", null, "GET")).json.links.find((x) => x.id === id);
  const status = (o, pid) => fetch(`${BASE}/api/pay/card/status?o=${o}${pid ? `&pid=${pid}` : ""}`).then((x) => x.json());
  const ck = async () => (await fetch(CF + "/__checkouts").then((x) => x.json())).pop();

  { const l = await mk("30", "No webhook"); const s = await session(l); const c = await ck();
    const pr = await cf("/__pay_checkout", { id: c.id, mode: "ok", webhooks: false });
    ok("no webhook: open until payment id known", (await linkNow(l.id)).status === "open");
    const st = await status(s.order, pr.paymentId);
    ok("return redirect payment id + on chain check marks Paid", st.status === "paid" && (await linkNow(l.id)).paid?.method === "card", st.status); }
  { const l = await mk("31", "Disbursed only"); await session(l); const c = await ck();
    await cf("/__pay_checkout", { id: c.id, mode: "ok", webhooks: false });
    // first learn the payment id from an Authorized event, then a Disbursed Funds event without webhookInfo
    const s2 = await session(await mk("32", "Disbursed only 2")); const c2 = await ck();
    await cf("/__pay_checkout", { id: c2.id, mode: "ok", disbursedOnly: true }); await wait(2000);
    ok("Disbursed Funds (no webhookInfo) matched by payment id", (await status(s2.order)).status === "paid"); }
  { const l = await mk("22", "Decline"); const s = await session(l); const c = await ck();
    await cf("/__pay_checkout", { id: c.id, mode: "decline" }); await wait(1500);
    const st = await status(s.order); ok("declined card -> failed, link open", st.status === "failed" && (await linkNow(l.id)).status === "open", st.failure); }
  { const l = await mk("40", "Short"); const s = await session(l); const c = await ck();
    await cf("/__pay_checkout", { id: c.id, mode: "ok" }); await wait(100);
    const l2 = await mk("41", "Short 2"); const s2 = await session(l2); const c2 = await ck();
    await cf("/__pay_checkout", { id: c2.id, mode: "short" }); await wait(2000);
    const st = await status(s2.order); ok("short delivery -> underpaid", st.status === "underpaid", st.received); }
  { const l = await mk("20", "Dup"); await session(l); const c = await ck();
    await cf("/__pay_checkout", { id: c.id, mode: "ok", duplicate: true }); await wait(2000);
    const hooks = await fetch(CF + "/__webhooks").then((x) => x.json());
    ok("duplicate webhooks accepted once", (await linkNow(l.id)).status === "paid", hooks.slice(-4).map((h) => h.status).join(",")); }
  { const r1 = await fetch(BASE + "/api/onramp/coinflow", { method: "POST", body: "{}" });
    const r2 = await cf("/__webhook_raw", { eventType: "Settled", data: { id: "x", signature: "abc" }, bad: true });
    ok("unsigned webhook refused", r1.status === 401); ok("bad Coinflow signature refused", r2.status === 401); }
  { const l = await mk("50", "Kenya");
    const q = await fetch(`${BASE}/api/pay/card/quote?${new URLSearchParams({ to: l.to, amount: l.amount, ref: l.ref })}`, { headers: { "x-vercel-ip-country": "KE", "x-forwarded-for": "198.51.100.201" } }).then((x) => x.json());
    ok("Kenya not served, explained", q.available === false && q.reason === "region" && q.country === "KE"); }
  { const l = await mk("12.345", "Three decimals");
    const q = await fetch(`${BASE}/api/pay/card/quote?${new URLSearchParams({ to: l.to, amount: l.amount, ref: l.ref })}`).then((x) => x.json());
    ok("sub cent amount refused", q.reason === "cents"); }
  { const s = await session(await mk("26", "No email"), ""); ok("email required for Coinflow", s.status === 400 && s.error === "email"); }
  await rctx.close();
  // receiver without a USDC account
  const bare = makeWallet(); const bctx = await newContext(b, bare, { width: 390 }); const bp = await bctx.newPage(); await signIn(bp);
  const lb = (await api(bp, "/api/links", { amount: "25", message: "No ATA" })).json.link;
  const { ctx, p } = await payer("light", "PH");
  await p.goto(payUrl(lb), { waitUntil: "networkidle" }); await p.getByRole("tab", { name: /Card or Apple Pay/ }).click(); await p.waitForTimeout(600);
  if (process.env.CF_SANDBOX) {
    ok("sandbox: no USDC account check, quote shown (devnet)", (await p.locator(".po-quote").count()) === 1);
  } else {
    const t = await p.locator(".po-off").innerText();
    ok("receiver without USDC account explained", t.includes("not set up for USDC"), t.replace(/\n/g, " | "));
  }
  await p.screenshot({ path: `${out}/pay-card-no-usdc-390.png` });
  await ctx.close(); await bctx.close();
}
console.log(res.join("\n")); console.log(errs.length ? "ERRORS " + errs.join("; ") : "no page errors");
await b.close();
