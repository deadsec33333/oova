import { chromium, makeWallet, newContext, signIn, api, BASE } from "./lib.mjs";
import fs from "node:fs";
const out = process.argv[2] || "/home/claude/shots/card"; fs.mkdirSync(out, { recursive: true });
const mp = (path, body) => fetch("http://127.0.0.1:8898" + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) }).then((r) => r.json());
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const w = makeWallet(); const res = [];
const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"} ${n} ${x}`);
for (const theme of ["light", "dark"]) for (const [W, H] of [[390, 844], [1440, 900]]) {
  const tag = `${W}-${theme}`;
  const ctx = await newContext(b, w, { width: W, height: H, theme }); const p = await ctx.newPage();
  await signIn(p);
  if (theme === "light" && W === 390) {
    const l = (await api(p, "/api/links", { amount: "25", message: "Logo design, first draft" })).json.link;
    const s = await fetch(BASE + "/api/pay/card/session", { method: "POST", headers: { origin: BASE, "content-type": "application/json" }, body: JSON.stringify({ to: l.to, amount: l.amount, ref: l.ref }) }).then((r) => r.json());
    await mp("/__widget_pay", { ext: s.order, wallet: l.to, amount: 25, mode: "ok" });
    await api(p, "/api/links", { amount: "40", message: "Website copy" });
  }
  await p.reload({ waitUntil: "networkidle" }); await p.waitForTimeout(1800);
  ok(`${tag} row says Paid by card`, (await p.locator(".ax-row", { hasText: "Logo design" }).innerText()).includes("Paid by card"));
  await p.screenshot({ path: `${out}/dash-${tag}.png`, fullPage: W === 390 ? false : true });
  await p.locator(".ax-row", { hasText: "Logo design" }).locator(".ax-row-main").click(); await p.waitForTimeout(700);
  ok(`${tag} receipt shows card method`, (await p.locator(".ax-receipt").innerText()).includes("Card via MoonPay"));
  await p.screenshot({ path: `${out}/detail-card-${tag}.png` });
  await p.keyboard.press("Escape"); await p.waitForTimeout(400);
  await p.locator(".ax-row", { hasText: "Website copy" }).locator(".ax-row-main").click(); await p.waitForTimeout(700);
  await p.locator(".ax-switchrow").scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${out}/detail-switch-${tag}.png` });
  if (theme === "light" && W === 390) {
    await p.getByRole("switch", { name: "Accept card payments" }).click(); await p.waitForTimeout(800);
    const L = (await api(p, "/api/links", null, "GET")).json.links.find((x) => x.message === "Website copy");
    ok("switch saves card off", L.card === false);
    const q = await fetch(`${BASE}/api/pay/card/quote?${new URLSearchParams({ to: L.to, amount: L.amount, ref: L.ref })}`).then((r) => r.json());
    ok("quote refuses when off", q.available === false && q.reason === "off");
    await p.getByRole("switch", { name: "Accept card payments" }).click(); await p.waitForTimeout(800);
    const L2 = (await api(p, "/api/links", null, "GET")).json.links.find((x) => x.message === "Website copy");
    ok("switch back on", L2.card === true);
  }
  await ctx.close();
}
console.log(res.join("\n")); await b.close();
