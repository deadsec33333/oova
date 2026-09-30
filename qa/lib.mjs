import { createRequire } from "node:module";
import crypto from "node:crypto";
const require = createRequire("/home/claude/q/package.json");
const bs58 = require("bs58").default ?? require("bs58");
const { chromium } = require("/home/claude/.npm-global/lib/node_modules/playwright");

export const BASE = process.env.BASE || "http://localhost:3000";
export const RPC = "http://127.0.0.1:8899";
export { chromium, bs58 };

export function makeWallet() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const raw = publicKey.export({ format: "der", type: "spki" }).subarray(-32);
  return { address: bs58.encode(raw), sign: (bytes) => Array.from(crypto.sign(null, Buffer.from(bytes), privateKey)) };
}
export const randAddr = () => bs58.encode(crypto.randomBytes(32));

export async function newContext(browser, wallet, { width = 390, height = 844, theme = "light", reduce = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, reducedMotion: reduce ? "reduce" : "no-preference", hasTouch: width < 800, isMobile: width < 800 });
  await ctx.exposeBinding("__qovaSign", (_s, bytes) => wallet.sign(bytes));
  await ctx.addInitScript(({ address, theme }) => {
    try { localStorage.setItem("qova-theme", theme); } catch {}
    const b58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    const decode = (s) => { let n = 0n; for (const c of s) n = n * 58n + BigInt(b58.indexOf(c)); const out = []; while (n > 0n) { out.unshift(Number(n & 255n)); n >>= 8n; } for (const c of s) { if (c === "1") out.unshift(0); else break; } return new Uint8Array(out); };
    const account = { address, publicKey: decode(address), chains: ["solana:mainnet"], features: ["solana:signMessage"] };
    const wallet = {
      version: "1.0.0", name: "Test Wallet", icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=", chains: ["solana:mainnet"], accounts: [account],
      features: {
        "standard:connect": { version: "1.0.0", connect: async () => ({ accounts: [account] }) },
        "solana:signMessage": { version: "1.0.0", signMessage: async (...ins) => Promise.all(ins.map(async (i) => ({ signedMessage: i.message, signature: new Uint8Array(await window.__qovaSign(Array.from(i.message))) }))) },
      },
    };
    window.__fakeWallet = wallet;
    window.addEventListener("wallet-standard:app-ready", (e) => { try { e.detail.register(wallet); } catch {} });
  }, { address: wallet.address, theme });
  return ctx;
}

export async function signIn(page) {
  await page.goto(BASE + "/app", { waitUntil: "networkidle" });
  if (await page.locator(".ax-shell").count()) return;
  await page.getByRole("button", { name: /Continue with a wallet/ }).click();
  await page.getByRole("button", { name: /Test Wallet/ }).click();
  await page.locator(".ax-shell").waitFor({ timeout: 15000 });
}

export async function api(page, path, body, method = "POST") {
  const r = await page.request.fetch(BASE + path, { method, headers: { origin: BASE, "content-type": "application/json" }, data: body ? JSON.stringify(body) : undefined });
  return { status: r.status(), json: await r.json().catch(() => ({})) };
}

export async function rpcCtl(path, body) {
  const r = await fetch(RPC + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
  return r.json();
}

const DAY = 86400_000;
/** Seed a realistic account: some paid links spread over the last week, some open. */
export async function seed(page, wallet) {
  const rows = [
    { amount: "250", message: "Website retainer, September", ago: 6.5, paidAgo: 6.2 },
    { amount: "40", message: "Logo edits", ago: 5, paidAgo: 4.8 },
    { amount: "120.5", message: "Translation, 3 pages", ago: 3.2, paidAgo: 2.9 },
    { amount: "15", message: "Lunch split", ago: 1.4, paidAgo: 1.1 },
    { amount: "75", message: "Photo shoot deposit", ago: 0.3, paidAgo: 0.05 },
    { amount: "300", message: "App design, milestone 2", ago: 0.2 },
    { amount: "9.99", message: "Sticker pack", ago: 0.1 },
    { amount: "60", message: "", ago: 2 },
  ];
  const made = [];
  for (const r of rows) {
    const ref = randAddr();
    const res = await api(page, "/api/links", { amount: r.amount, message: r.message, ref, createdAt: Date.now() - r.ago * DAY });
    made.push({ ...r, link: res.json.link });
  }
  for (const m of made.filter((x) => x.paidAgo !== undefined)) {
    const raw = Math.round(Number(m.amount) * 1e6);
    await rpcCtl("/__pay", { ref: m.link.ref, to: wallet.address, raw, payer: randAddr(), blockTime: Math.floor((Date.now() - m.paidAgo * DAY) / 1000) });
    await api(page, `/api/links/${m.link.id}/check`);
  }
  await rpcCtl("/__balance", { owner: wallet.address, raw: 1284_370000 });
  return made;
}
