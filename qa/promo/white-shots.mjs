// Light theme captures of the real app for the white post set. Dashboard numbers are seeded sample data.
import { chromium, makeWallet, newContext, signIn, api, seed, rpcCtl, BASE } from "./lib.mjs";
import fs from "node:fs";
const out = "/home/claude/white/raw"; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const errs = [];
// landing
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: w < 800, hasTouch: w < 800 });
  await ctx.addInitScript(() => { try { localStorage.setItem("qova-theme", "light"); } catch {} });
  const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(BASE + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/landing-${w}.png` }); await ctx.close();
}
// receiver with sample history
const recv = makeWallet();
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const ctx = await newContext(b, recv, { width: w, height: h, theme: "light" }); const r = await ctx.newPage(); r.on("pageerror", (e) => errs.push(e.message));
  await signIn(r);
  if (w === 390) await seed(r, recv);
  await r.reload({ waitUntil: "networkidle" }); await r.waitForTimeout(2200);
  await r.screenshot({ path: `${out}/dash-toast-${w}.png` });
  for (const x of await r.locator(".qt-x").all()) await x.click().catch(() => {});
  await r.waitForTimeout(700);
  await r.screenshot({ path: `${out}/dash-${w}.png` });
  if (w === 390) {
    await r.locator(".ax-row", { hasText: "Photo shoot deposit" }).first().locator(".ax-row-main").click(); await r.waitForTimeout(900);
    await r.screenshot({ path: `${out}/detail-paid-390.png` });
    await r.locator(".ax-receipt").scrollIntoViewIfNeeded(); await r.waitForTimeout(600);
    await r.screenshot({ path: `${out}/receipt-390.png` });
    await r.keyboard.press("Escape"); await r.waitForTimeout(500);
    await r.locator(".ax-row", { hasText: "App design, milestone 2" }).first().locator(".ax-row-main").click(); await r.waitForTimeout(800);
    await r.getByRole("button", { name: "Counter mode QR" }).click(); await r.waitForTimeout(1500);
    await r.screenshot({ path: `${out}/counter-390.png` });
  }
  await ctx.close();
}
// payer view of an open link
{
  const rctx = await newContext(b, recv, { width: 390, theme: "light" }); const r = await rctx.newPage(); await signIn(r);
  const l = (await api(r, "/api/links", { amount: "120", message: "Translation, 3 pages" })).json.link; await rctx.close();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { try { localStorage.setItem("qova-theme", "light"); } catch {} });
  const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(`${BASE}/pay?${new URLSearchParams({ to: l.to, amount: l.amount, message: l.message, ref: l.ref })}`, { waitUntil: "networkidle" }); await p.waitForTimeout(2000);
  await p.screenshot({ path: `${out}/pay-390.png` });
  // pay it from a wallet so the Paid state is real on the stand in chain
  await rpcCtl("/__pay", { ref: l.ref, to: l.to, raw: 120_000000, payer: makeWallet().address, blockTime: Math.floor(Date.now() / 1000) });
  await p.waitForTimeout(9000);
  await p.screenshot({ path: `${out}/pay-paid-390.png` });
  await ctx.close();
}
await b.close(); console.log(fs.readdirSync(out).join(" "), errs.length ? "ERR " + errs.join("; ") : "no errors");
