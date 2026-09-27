// Card e2e: receiver dashboard open, payer pays by card through the pay page and the MoonPay stand in.
import { chromium, makeWallet, newContext, signIn, api, BASE } from "./lib.mjs";
const mp = (path, body) => fetch("http://127.0.0.1:8898" + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) }).then((r) => r.json());
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const res = []; const errs = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${x ? " · " + x : ""}`);
await mp("/__country", { alpha2: "PH", buy: true });
for (const theme of ["light", "dark"]) {
  const recv = makeWallet();
  const rctx = await newContext(b, recv, { width: 1440, height: 900, theme }); const r = await rctx.newPage();
  r.on("pageerror", (e) => errs.push(e.message));
  await signIn(r);
  const l = (await api(r, "/api/links", { amount: "25", message: `Card e2e ${theme}` })).json.link;
  await r.reload({ waitUntil: "networkidle" });
  const payUrl = `${BASE}/pay?${new URLSearchParams({ to: l.to, amount: l.amount, message: l.message, ref: l.ref })}`;

  // payer on a phone, different IP, no QOVA account
  const pctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, extraHTTPHeaders: { "x-forwarded-for": `198.51.100.${theme === "light" ? 11 : 12}` } });
  await pctx.addInitScript((t) => { try { localStorage.setItem("qova-theme", t); } catch {} }, theme);
  const p = await pctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(payUrl, { waitUntil: "networkidle" });
  await p.getByRole("tab", { name: /Card or Apple Pay/ }).click();
  await p.locator(".po-quote").waitFor();
  const qt = await p.locator(".po-quote").innerText();
  ok(`${theme} quote shows you pay and receiver gets`, qt.includes("$29.00") && qt.includes("25.00 USDC") && qt.includes("QOVA fee"), qt.replace(/\n/g, " | "));
  await p.getByRole("button", { name: /Continue to MoonPay/ }).click();
  await p.waitForURL(/8898\/widget/);
  ok(`${theme} widget signature ok`, (await p.locator("#sig").innerText()) === "ok");
  ok(`${theme} widget wallet locked to receiver`, (await p.locator("#wallet").inputValue()) === l.to && (await p.locator("#wallet").getAttribute("readonly")) !== null);
  ok(`${theme} widget amount is the link amount`, (await p.locator("#amount").innerText()).trim() === "25");
  const t0 = Date.now();
  await p.click("#pay");
  await p.waitForURL(/\/pay\/card\?o=/);
  await p.locator(".cr.is-paid").waitFor({ timeout: 20000 });
  ok(`${theme} return screen shows Paid by card`, true, `${((Date.now() - t0) / 1000).toFixed(1)} s`);
  ok(`${theme} return screen has Solscan receipt`, (await p.locator(".cr a[href*='solscan.io/tx/']").count()) === 1);
  // receiver side: toast from the site wide watcher (every 15 s)
  await r.locator(".qt").waitFor({ timeout: 25000 });
  const toast = await r.locator(".qt").first().innerText();
  ok(`${theme} receiver toast says paid by card`, /paid by card/i.test(toast) && toast.includes("25.00"), toast.replace(/\n/g, " | "));
  await r.waitForTimeout(800);
  ok(`${theme} dashboard row Paid by card`, (await r.locator(".ax-row", { hasText: `Card e2e ${theme}` }).innerText()).includes("Paid by card"));
  // pay page afterwards: card no longer offered
  await p.goto(payUrl, { waitUntil: "networkidle" });
  await p.getByRole("tab", { name: /Card or Apple Pay/ }).click(); await p.waitForTimeout(500);
  ok(`${theme} paid link refuses a second card payment`, (await p.locator(".po-off").innerText()).includes("already paid"));
  await pctx.close(); await rctx.close();
}
// region block with a real per IP answer
{ await mp("/__country", { alpha2: "NG", buy: false });
  const recv = makeWallet(); const rctx = await newContext(b, recv, { width: 390 }); const r = await rctx.newPage(); await signIn(r);
  const l = (await api(r, "/api/links", { amount: "50", message: "Region" })).json.link;
  const pctx = await b.newContext({ viewport: { width: 390, height: 844 }, extraHTTPHeaders: { "x-forwarded-for": "198.51.100.77" } });
  const p = await pctx.newPage();
  await p.goto(`${BASE}/pay?${new URLSearchParams({ to: l.to, amount: l.amount, ref: l.ref })}`, { waitUntil: "networkidle" });
  await p.getByRole("tab", { name: /Card or Apple Pay/ }).click(); await p.waitForTimeout(500);
  const t = await p.locator(".po-off").innerText();
  ok("blocked region explained", t.includes("NG"), t.replace(/\n/g, " | "));
  await p.screenshot({ path: "/home/claude/shots/card/pay-card-region-390.png" });
  await mp("/__country", { alpha2: "PH", buy: true }); await pctx.close(); await rctx.close(); }
// wallet only link (made without an account): card tab explains
{ const pctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await pctx.newPage();
  const to = makeWallet().address, ref = makeWallet().address;
  await p.goto(`${BASE}/pay?${new URLSearchParams({ to, amount: "20", ref })}`, { waitUntil: "networkidle" });
  await p.getByRole("tab", { name: /Card or Apple Pay/ }).click(); await p.waitForTimeout(500);
  ok("unsaved link says wallet only", (await p.locator(".po-off").innerText()).includes("wallet payments only")); await pctx.close(); }
console.log(res.join("\n")); console.log(errs.length ? "ERRORS " + errs.join("; ") : "no page errors");
await b.close();
