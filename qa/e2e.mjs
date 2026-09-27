// End to end: sign in, create, counter QR paid, reload, delete, plus balance, single watcher, reduced motion, share fallback.
import { chromium, makeWallet, newContext, signIn, api, rpcCtl, randAddr, BASE } from "./lib.mjs";
import fs from "node:fs";
const out = process.argv[2] || "/home/claude/shots/e2e"; fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const results = []; const ok = (name, cond, extra = "") => { results.push(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " · " + extra : ""}`); };
const errors = [];

for (const theme of ["light", "dark"]) {
  const wallet = makeWallet();
  await rpcCtl("/__balance", { owner: wallet.address, raw: 42_500000 });
  const ctx = await newContext(browser, wallet, { width: 390, height: 844, theme });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${theme}: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|401/.test(m.text())) errors.push(`${theme} console: ${m.text()}`); });
  const checks = []; page.on("request", (r) => { if (/\/check$|\/api\/pay\/status/.test(r.url())) checks.push({ t: Date.now(), u: r.url() }); });

  await signIn(page);
  ok(`${theme} sign in shows dashboard`, await page.locator(".ax-shell").isVisible());

  // create through the Quick link card
  await page.locator(".ax-quick-card input[inputmode=decimal]").fill("12.5");
  await page.locator(".ax-quick-card .ax-q-for").fill("E2E test");
  await page.locator(".ax-quick-card button[type=submit]").click();
  await page.locator(".ax-quick-card .ax-made").waitFor();
  ok(`${theme} create shows Link ready`, (await page.locator(".ax-quick-card .ax-made").innerText()).includes("12.50"));
  ok(`${theme} new link in list`, await page.locator(".ax-row", { hasText: "E2E test" }).count() === 1);
  const { json } = await api(page, "/api/links", null, "GET");
  const link = json.links.find((l) => l.message === "E2E test");
  ok(`${theme} link saved on server`, !!link && link.amount === "12.5");

  // counter mode from the made card
  await page.getByRole("button", { name: "Show QR full screen" }).click();
  await page.locator(".ax-counter").waitFor();
  await page.waitForTimeout(900);
  ok(`${theme} counter shows QR`, await page.locator(".ax-counter .qr svg").count() === 1);
  const awake = await page.locator(".ax-counter-awake").innerText();
  await page.screenshot({ path: `${out}/counter-390-${theme}.png` });

  // payment lands on chain
  const t0 = Date.now();
  await rpcCtl("/__pay", { ref: link.ref, to: wallet.address, raw: 12_500000, payer: randAddr(), blockTime: Math.floor(Date.now() / 1000) });
  await page.locator(".ax-counter.is-paid").waitFor({ timeout: 12000 });
  ok(`${theme} counter flips to Paid`, true, `${((Date.now() - t0) / 1000).toFixed(1)} s, screen: ${awake}`);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}/counter-paid-390-${theme}.png` });
  ok(`${theme} paid toast`, await page.locator(".qt").count() >= 1);
  await page.waitForTimeout(1500);
  const after = await api(page, "/api/links", null, "GET");
  ok(`${theme} server stored paid`, after.json.links.find((l) => l.id === link.id)?.status === "paid");

  // new link from the paid screen opens the sheet
  await page.getByRole("button", { name: "New link" }).last().click();
  ok(`${theme} New link sheet opens`, await page.locator(".ax-sheet").isVisible());
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);

  // reload: still paid, no repeat alert
  await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(2500);
  ok(`${theme} reload keeps Paid pill`, await page.locator(".ax-row", { hasText: "E2E test" }).locator(".ax-pill-paid").count() === 1);
  ok(`${theme} no repeat toast after reload`, await page.locator(".qt").count() === 0);

  // delete an open link from its detail sheet, and share falls back to copy
  await api(page, "/api/links", { amount: "3", message: "Delete me" });
  await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(1200);
  await page.locator(".ax-row", { hasText: "Delete me" }).locator(".ax-row-main").click();
  await page.locator(".ax-det").waitFor();
  await page.getByRole("button", { name: "Share link" }).click(); await page.waitForTimeout(300);
  const note = await page.locator(".ax-det [role=status]").innerText().catch(() => "");
  const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
  ok(`${theme} share falls back to copy`, /copied/i.test(note) && clip.includes("/pay?"), note);
  await page.locator(".ax-del").click();
  ok(`${theme} delete asks twice`, (await page.locator(".ax-del").innerText()).includes("Tap again"));
  await page.locator(".ax-del").click();
  await page.locator(".ax-sheet").waitFor({ state: "detached" });
  ok(`${theme} deleted from list`, await page.locator(".ax-row", { hasText: "Delete me" }).count() === 0);
  const g = await api(page, "/api/links", null, "GET");
  ok(`${theme} deleted on server`, !g.json.links.some((l) => l.message === "Delete me"));

  // single watcher: count checks while idle on the dashboard with open links
  await api(page, "/api/links", { amount: "4", message: "Open A" });
  await api(page, "/api/links", { amount: "5", message: "Open B" });
  await page.reload({ waitUntil: "networkidle" });
  checks.length = 0; const w0 = Date.now();
  await page.waitForTimeout(33000);
  const n = checks.filter((c) => c.t >= w0).length;
  ok(`${theme} one watcher only`, n <= 8, `${n} checks in 33 s for 2 open links (AccountHost every 15 s)`);

  // balance shown and labelled
  const balTxt = await page.locator(".ax-hero-f > div").first().innerText();
  ok(`${theme} In your wallet shows on chain balance`, balTxt.includes("42.50") && /In your wallet/i.test(balTxt), balTxt.replace(/\n/g, " "));

  // sign out from Wallet tab
  await page.getByRole("button", { name: /^Wallet$/ }).first().click();
  await page.getByRole("button", { name: "Sign out" }).last().click();
  await page.getByRole("button", { name: /Continue with a wallet/ }).waitFor();
  ok(`${theme} sign out returns to sign in`, true);
  await ctx.close();
}

// balance cache and RPC failure
{
  const wallet = makeWallet();
  await rpcCtl("/__balance", { owner: wallet.address, raw: 7_000000 });
  const ctx = await newContext(browser, wallet, { width: 1440, height: 900 });
  const page = await ctx.newPage();
  await signIn(page); await page.waitForTimeout(1000);
  const c1 = (await (await fetch("http://127.0.0.1:8899/__calls", { method: "POST" })).json()).getTokenAccountsByOwner;
  const a = await api(page, "/api/wallet/balance", null, "GET");
  const b = await api(page, "/api/wallet/balance", null, "GET");
  const c2 = (await (await fetch("http://127.0.0.1:8899/__calls", { method: "POST" })).json()).getTokenAccountsByOwner;
  ok("balance endpoint cached", a.json.usdc === "7.00" && b.json.cached === true && c2 === c1, `rpc calls ${c1} then ${c2}`);
  const anon = await (await fetch(BASE + "/api/wallet/balance")).status;
  ok("balance needs sign in", anon === 401);
  // RPC down for a fresh wallet: quiet placeholder
  const w2 = makeWallet();
  await rpcCtl("/__fail", { on: true });
  const ctx2 = await newContext(browser, w2, { width: 390, height: 844 });
  const p2 = await ctx2.newPage();
  await signIn(p2); await p2.waitForTimeout(1500);
  ok("RPC down shows a quiet placeholder", await p2.locator(".ax-hero-f .ax-quiet").count() === 1);
  await p2.screenshot({ path: `${out}/rpc-down-390.png` });
  await rpcCtl("/__fail", { on: false });
  await ctx.close(); await ctx2.close();
}

// reduced motion: no count up, number final at once
{
  const wallet = makeWallet();
  const ctx = await newContext(browser, wallet, { width: 390, height: 844, reduce: true });
  const page = await ctx.newPage();
  await signIn(page);
  const l = (await api(page, "/api/links", { amount: "88", message: "RM" })).json.link;
  await rpcCtl("/__pay", { ref: l.ref, to: wallet.address, raw: 88_000000, payer: wallet.address, blockTime: Math.floor(Date.now() / 1000) });
  await api(page, `/api/links/${l.id}/check`);
  await page.reload();
  await page.locator(".ax-hero-v b").waitFor();
  const samples = [];
  for (let i = 0; i < 5; i++) { samples.push(await page.locator(".ax-hero-v b").innerText()); await page.waitForTimeout(60); }
  ok("reduced motion: no count up", samples.every((s) => s === "88.00"), samples.join(","));
  await ctx.close();
}

await browser.close();
console.log(results.join("\n"));
console.log(errors.length ? "ERRORS\n" + errors.join("\n") : "no page errors");
