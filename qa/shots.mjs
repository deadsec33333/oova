// Usage: node shots.mjs <outdir> [new]
import { chromium, makeWallet, newContext, signIn, seed, rpcCtl, BASE } from "./lib.mjs";
import fs from "node:fs";
const out = process.argv[2]; const isNew = process.argv[3] === "new";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const wallet = makeWallet();
const errors = [];
let seeded = false;
await rpcCtl("/__balance", { owner: wallet.address, raw: 1284_370000 });

for (const theme of ["light", "dark"]) {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await newContext(browser, wallet, { width: w, height: h, theme });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push(`${theme}${w}: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") errors.push(`${theme}${w} console: ${m.text()}`); });
    await signIn(page);
    if (!seeded) { await seed(page, wallet); seeded = true; }
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2600);
    const tag = `${w}-${theme}`;
    await page.screenshot({ path: `${out}/home-${tag}.png`, fullPage: true });
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (ov > 0) errors.push(`${tag}: horizontal overflow ${ov}px`);
    if (isNew) {
      // link detail
      await page.locator(".ax-row").first().click();
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${out}/detail-${tag}.png` });
      await page.keyboard.press("Escape"); await page.waitForTimeout(400);
      // links tab
      await page.getByRole("button", { name: /^Links\s*\d*$/ }).first().click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${out}/links-${tag}.png`, fullPage: true });
      await page.getByRole("button", { name: /^Wallet$/ }).first().click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${out}/wallet-${tag}.png`, fullPage: true });
      await page.getByRole("button", { name: /^Activity$/ }).first().click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${out}/activity-${tag}.png`, fullPage: true });
    } else {
      await page.locator('.ax-row button[aria-label="Show QR"]').first().click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `${out}/qr-${tag}.png` });
    }
    await ctx.close();
  }
}
// empty account
const w2 = makeWallet();
for (const theme of ["light", "dark"]) {
  const ctx = await newContext(browser, w2, { width: 390, height: 844, theme });
  const page = await ctx.newPage();
  await signIn(page); await page.waitForTimeout(2000);
  await page.screenshot({ path: `${out}/empty-390-${theme}.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
console.log(errors.length ? errors.join("\n") : "no errors");
