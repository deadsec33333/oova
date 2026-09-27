import { chromium, makeWallet, newContext, signIn, api, rpcCtl, BASE } from "./lib.mjs";
const out = "/home/claude/shots/coinflow";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const recv = makeWallet(); await rpcCtl("/__balance", { owner: recv.address, raw: 0 });
const rctx = await newContext(b, recv, { width: 390 }); const r = await rctx.newPage(); await signIn(r);
const l = (await api(r, "/api/links", { amount: "25", message: "Logo design, first draft" })).json.link;
let n = 60;
for (const theme of ["light", "dark"]) for (const [W, H] of [[1440, 900], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: W < 800, extraHTTPHeaders: { "x-forwarded-for": `198.51.100.${n++}`, "x-vercel-ip-country": "NG" } });
  await ctx.addInitScript((t) => { try { localStorage.setItem("qova-theme", t); } catch {} }, theme);
  const p = await ctx.newPage();
  await p.goto(`${BASE}/pay?${new URLSearchParams({ to: l.to, amount: l.amount, message: l.message, ref: l.ref })}`, { waitUntil: "networkidle" });
  await p.getByRole("tab", { name: /Card or Apple Pay/ }).click(); await p.locator(".po-quote").waitFor();
  await p.locator(".po-email input").fill("payer@example.com");
  if (W === 1440) await p.screenshot({ path: `${out}/pay-card-1440-${theme}.png`, fullPage: true });
  else { const el = p.locator(".po-card"); await el.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/pay-card-fold-390-${theme}.png` }); }
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ov > 0) console.log("overflow", W, theme, ov);
  await ctx.close();
}
await b.close(); console.log("ok");
