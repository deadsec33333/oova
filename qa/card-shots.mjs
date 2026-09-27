import { chromium, makeWallet, newContext, signIn, api, BASE } from "./lib.mjs";
import fs from "node:fs";
const out = process.argv[2] || "/home/claude/shots/card"; fs.mkdirSync(out, { recursive: true });
const MP = "http://127.0.0.1:8898";
const mp = (path, body) => fetch(MP + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) }).then((r) => r.json());
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const w = makeWallet();
const errs = [];
await mp("/__country", { alpha2: "PH", buy: true });
for (const theme of ["light", "dark"]) for (const [W, H] of [[390, 844], [1440, 900]]) {
  const tag = `${W}-${theme}`;
  const ctx = await newContext(b, w, { width: W, height: H, theme }); const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(tag + " " + e.message));
  await signIn(p);
  const l = (await api(p, "/api/links", { amount: "25", message: "Logo design, first draft" })).json.link;
  const url = `${BASE}/pay?${new URLSearchParams({ to: l.to, amount: l.amount, message: l.message, ref: l.ref })}`;
  await p.goto(url, { waitUntil: "networkidle" }); await p.waitForTimeout(800);
  await p.screenshot({ path: `${out}/pay-wallet-${tag}.png`, fullPage: true });
  await p.getByRole("tab", { name: /Card or Apple Pay/ }).click(); await p.waitForTimeout(600);
  await p.screenshot({ path: `${out}/pay-card-${tag}.png`, fullPage: true });
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ov > 0) errs.push(`${tag} overflow ${ov}`);
  if (W === 390) {
    // continue to checkout (stub widget), pay with delay to see pending then processing then paid
    await p.getByRole("button", { name: /Continue to MoonPay/ }).click();
    await p.waitForURL(/8898\/widget/);
    await p.screenshot({ path: `${out}/widget-${tag}.png` });
    const ext = new URL(p.url()).searchParams.get("externalTransactionId");
    // pending: go to the return page before paying
    await p.goto(`${BASE}/pay/card?o=${ext}`); await p.waitForTimeout(1200);
    await p.screenshot({ path: `${out}/return-pending-${tag}.png` });
    await mp("/__widget_pay", { ext, wallet: l.to, amount: 25, mode: "ok", delayMs: 6000 });
    await p.waitForTimeout(5000);
    await p.screenshot({ path: `${out}/return-processing-${tag}.png` });
    await p.locator(".cr.is-paid").waitFor({ timeout: 20000 });
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${out}/return-paid-${tag}.png` });
  }
  await ctx.close();
}
// unavailable states
{ const ctx = await newContext(b, w, { width: 390 }); const p = await ctx.newPage(); await signIn(p);
  const small = (await api(p, "/api/links", { amount: "5", message: "Coffee" })).json.link;
  await p.goto(`${BASE}/pay?${new URLSearchParams({ to: small.to, amount: small.amount, message: small.message, ref: small.ref })}`, { waitUntil: "networkidle" });
  await p.getByRole("tab", { name: /Card or Apple Pay/ }).click(); await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/pay-card-min-390.png` });
  await mp("/__country", { alpha2: "NG", buy: false }); await ctx.setExtraHTTPHeaders({ "x-forwarded-for": "198.51.100.90" });
  await fetch("http://127.0.0.1:8079", { method: "POST", body: JSON.stringify(["PING"]) });
  const l2 = (await api(p, "/api/links", { amount: "50", message: "Region test" })).json.link;
  await p.goto(`${BASE}/pay?${new URLSearchParams({ to: l2.to, amount: l2.amount, message: l2.message, ref: l2.ref })}`, { waitUntil: "networkidle" });
  await p.getByRole("tab", { name: /Card or Apple Pay/ }).click(); await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/pay-card-region-390.png` });
  await mp("/__country", { alpha2: "PH", buy: true });
  await ctx.close(); }
await b.close();
console.log(errs.length ? errs.join("\n") : "no errors");
