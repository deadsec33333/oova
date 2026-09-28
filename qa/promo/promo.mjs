// Real UI captures of the card flow (test build + stand in services) for promo visuals.
import { chromium, makeWallet, newContext, signIn, api, rpcCtl, BASE } from "./lib.mjs";
import fs from "node:fs";
const theme = process.argv[2] || "dark";
const out = `/home/claude/promo/raw-${theme}`; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const W = 390, H = 844, vsize = { width: 780, height: 1688 };
const marks = {}; const T0 = {};
const mark = (who, k) => { marks[`${who}.${k}`] = (Date.now() - T0[who]) / 1000; };
const errs = [];


const recv = makeWallet();
await rpcCtl("/__balance", { owner: recv.address, raw: 0 });
T0.r = Date.now();
const rctx = await newContext(b, recv, { width: W, height: H, theme });
const r = await rctx.newPage(); r.on("pageerror", (e) => errs.push(e.message));
await signIn(r);
const l = (await api(r, "/api/links", { amount: "25", message: "Logo design" })).json.link;
await r.reload({ waitUntil: "networkidle" }); await r.waitForTimeout(1200);
await r.screenshot({ path: `${out}/00-home.png` });
await r.locator(".ax-row", { hasText: "Logo design" }).first().locator(".ax-row-main").click(); await r.waitForTimeout(900);
await r.screenshot({ path: `${out}/01-link.png` });
// scroll the sheet to show the card switch
await r.locator(".ax-switchrow").scrollIntoViewIfNeeded(); await r.waitForTimeout(500);
await r.screenshot({ path: `${out}/01b-switch.png` });
await r.keyboard.press("Escape"); await r.waitForTimeout(500);

T0.p = Date.now();
const pctx = await b.newContext({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, extraHTTPHeaders: { "x-forwarded-for": "198.51.100.77", "x-vercel-ip-country": "PH" } });
await pctx.addInitScript((t) => { try { localStorage.setItem("qova-theme", t); } catch {}
  // promo only: hide stand in fee values (not real quotes); the receiver amount stays visible
  document.addEventListener("DOMContentLoaded", () => { const st = document.createElement("style"); st.textContent = ".po-quote .po-row > :last-child{filter:blur(7px)} .po-quote .po-row:nth-child(2) > :last-child{filter:none}"; document.head.appendChild(st); });
}, theme);
const p = await pctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
await p.goto(`${BASE}/pay?${new URLSearchParams({ to: l.to, amount: l.amount, message: l.message, ref: l.ref })}`, { waitUntil: "networkidle" });
mark("p", "open"); await p.waitForTimeout(1800);
await p.screenshot({ path: `${out}/02-pay.png` });
await p.getByRole("tab", { name: /Card or Apple Pay/ }).click(); mark("p", "tab");
await p.locator(".po-quote").waitFor(); await p.waitForTimeout(900);
await p.evaluate(() => { const el = document.querySelector('[role="tablist"]'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 24, behavior: "instant" }); });
await p.waitForTimeout(1200);
await p.locator(".po-email input").pressSequentially("you@example.com", { delay: 60 });
await p.waitForTimeout(500);
await p.screenshot({ path: `${out}/03-card.png` });
mark("p", "typed");
await p.getByRole("button", { name: /Continue to Coinflow/ }).click();
await p.waitForURL(/8897\/checkout\//); mark("p", "checkout");
await p.click("#pay");
await p.waitForURL(/\/pay\/card\?/); mark("p", "return");
await p.locator(".cr.is-paid").waitFor({ timeout: 20000 }); mark("p", "paid");
await p.waitForTimeout(2200);
await p.screenshot({ path: `${out}/04-paid.png` });
mark("p", "end");

await r.locator(".qt").waitFor({ timeout: 25000 }); mark("r", "toast");
await r.waitForTimeout(900);
await r.screenshot({ path: `${out}/05-toast.png` });
await r.waitForTimeout(1500);
await r.locator(".ax-row", { hasText: "Logo design" }).first().locator(".ax-row-main").click(); await r.waitForTimeout(1000);
await r.screenshot({ path: `${out}/06-detail.png` });
await r.locator(".ax-receipt").scrollIntoViewIfNeeded(); await r.waitForTimeout(700);
await r.screenshot({ path: `${out}/07-receipt.png` });
mark("r", "end");
await pctx.close(); await rctx.close(); await b.close();
fs.writeFileSync(`${out}/marks.json`, JSON.stringify(marks, null, 1));
console.log(marks, errs.length ? "ERRORS " + errs.join("; ") : "no page errors");
