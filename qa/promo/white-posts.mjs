// White post set for X. Real app captures + the supplied mark. Dashboard numbers are seeded sample data and labelled.
import { createRequire } from "node:module"; import fs from "node:fs";
const require = createRequire("/home/claude/q/web/package.json");
const { chromium } = require("/home/claude/.npm-global/lib/node_modules/playwright");
const D = "/home/claude/white", R = `${D}/raw`, F = "/home/claude/promo", MARK = "/home/claude/brandw/mark.svg";
const u = (f) => `file://${f}`;
const base = (W, H) => `@font-face{font-family:G;src:url(${u(F + "/geist.woff2")})}@font-face{font-family:GM;src:url(${u(F + "/geistmono.woff2")})}
*{margin:0;box-sizing:border-box}
:root{--bg:#fbfbfa;--ink:#0a0a0a;--mut:#8b8b88;--line:#e7e7e3;--mint:#3ddc97}
body{width:${W}px;height:${H}px;background:var(--bg);color:var(--ink);font-family:G;position:relative;overflow:hidden;-webkit-font-smoothing:antialiased}
.m{font-family:GM;text-transform:uppercase;letter-spacing:.16em;font-size:15px;color:var(--mut)}
.top{position:absolute;left:72px;right:72px;top:64px;display:flex;justify-content:space-between;align-items:center}
.brand{display:flex;align-items:center;gap:12px;font-weight:600;letter-spacing:.24em;font-size:17px}
.brand img{width:26px;height:26px}
.bot{position:absolute;left:72px;right:72px;bottom:56px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px}
.bot .m{font-size:12.5px;letter-spacing:.12em}
h1{font-weight:500;letter-spacing:-.045em;line-height:.98}
.g{color:var(--mut)}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--mint);box-shadow:0 0 0 5px rgba(61,220,151,.18);vertical-align:middle}
.phone{position:absolute;border-radius:64px;padding:11px;background:linear-gradient(145deg,#2a2a2a,#0c0c0c 40%,#1d1d1d);
  box-shadow:0 1px 0 1px #3a3a3a inset,0 0 0 1px #000,0 60px 90px -30px rgba(0,0,0,.28),0 30px 60px -20px rgba(0,0,0,.18),0 12px 24px -8px rgba(0,0,0,.12)}
.phone>div{border-radius:54px;overflow:hidden;background:#fff;height:100%}
.phone img{display:block;width:100%;height:100%;object-fit:cover;object-position:top}
.floor{position:absolute;height:60px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.16),transparent);filter:blur(8px)}
.card{position:absolute;border-radius:28px;background:#fff;box-shadow:0 0 0 1px var(--line),0 40px 80px -30px rgba(0,0,0,.18),0 12px 30px -12px rgba(0,0,0,.08);overflow:hidden}
.card img{display:block;width:100%}
.hair{height:1px;background:var(--line)}`;
const top = (tag) => `<div class=top><span class=brand><img src="${u(MARK)}">QOVA</span><span class=m>${tag}</span></div>`;
const bot = (l, r = "") => `<div class=bot><span class=m>${l}</span><span class=m style="text-align:right">${r}</span></div>`;
const phone = (img, x, y, w, pos = "top") => { const h = Math.round(w * 2.05); return `<div class=floor style="left:${x + w * .1}px;width:${w * .8}px;top:${y + h - 20}px"></div><div class=phone style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><div><img src="${u(R + "/" + img)}" style="object-position:${pos}"></div></div>`; };
const DISC = "$QOVA is a memecoin, not a dollar";

const posts = [
  ["01-no-face", 1080, 1350, `${top("Lore · 01")}
    <div style="position:absolute;left:72px;right:72px;top:170px"><h1 style="font-size:84px"><span class=g>Every coin in history carried a face.</span><br>Qova was struck with none.</h1></div>
    <img src="${u(R + "/coin-front.png")}" style="position:absolute;left:140px;top:470px;width:800px;height:800px">
    ${bot("No king · no president · no flag", "Just a circle and a tail")}`],

  ["02-send-a-link", 1080, 1350, `${top("USDC on Solana")}
    <div style="position:absolute;left:72px;top:170px;width:470px"><h1 style="font-size:96px">Send a link.<br><span class=g>Get dollars.</span></h1>
    <p style="margin-top:34px;font-size:27px;line-height:1.45;color:#4a4a48">Make a pay link for the exact amount. Anyone pays it from any Solana wallet. The USDC lands in your wallet, not ours.</p></div>
    ${phone("pay-390.png", 590, 170, 420)}
    ${bot("Free to use · wallet to wallet", DISC)}`],

  ["03-how-it-works", 1080, 1350, `${top("How it works")}
    <div style="position:absolute;left:72px;right:72px;top:170px"><h1 style="font-size:84px">Three steps.<br><span class=g>No bank in between.</span></h1></div>
    <div style="position:absolute;left:72px;right:72px;top:520px">
      ${[["01", "Make a link", "Type the amount and what it is for. You get a link and a QR code."], ["02", "Send it anywhere", "WhatsApp, email, a DM, a printed QR on the counter."], ["03", "Get the exact amount", "They pay from any Solana wallet. USDC lands straight in yours, confirmed on chain."]].map(([n, t, s], i) => `
      <div class=hair></div><div style="display:grid;grid-template-columns:120px 1fr;padding:40px 0">
        <span class=m style="font-size:17px;padding-top:12px">${n}${i === 2 ? ` <span class=dot style="margin-left:12px"></span>` : ""}</span>
        <div><div style="font-size:46px;letter-spacing:-.03em;font-weight:500">${t}</div><div style="font-size:25px;color:#5a5a58;margin-top:10px;line-height:1.4">${s}</div></div></div>`).join("")}
      <div class=hair></div></div>
    ${bot("qova · pay links", DISC)}`],

  ["04-never-holds", 1080, 1350, `${top("Canon · 03")}
    <div style="position:absolute;left:72px;right:72px;top:170px"><h1 style="font-size:92px">Qova never<br>holds your money.</h1>
    <p style="margin-top:30px;font-size:27px;line-height:1.45;color:#4a4a48;max-width:820px">The payer's wallet sends USDC straight to yours. We only make the link and watch the chain for it.</p></div>
    <div style="position:absolute;left:72px;right:72px;top:760px;height:260px">
      <div style="position:absolute;left:0;top:70px;width:250px;padding:30px 26px;border:1px solid var(--line);border-radius:26px;background:#fff"><span class=m>From</span><div style="font-size:32px;margin-top:10px;letter-spacing:-.02em">Their wallet</div></div>
      <div style="position:absolute;right:0;top:70px;width:250px;padding:30px 26px;border:1px solid var(--ink);border-radius:26px;background:#fff"><span class=m>To</span><div style="font-size:32px;margin-top:10px;letter-spacing:-.02em">Your wallet <span class=dot style="margin-left:6px"></span></div></div>
      <div style="position:absolute;left:250px;right:250px;top:137px;height:2px;background:var(--ink)"></div>
      <div style="position:absolute;left:50%;top:106px;transform:translateX(-50%);background:var(--bg);padding:0 18px" class=m>USDC · direct</div>
      <div style="position:absolute;left:50%;top:190px;transform:translateX(-50%);text-align:center"><div style="width:1px;height:40px;margin:0 auto;background:repeating-linear-gradient(var(--mut) 0 4px,transparent 4px 9px)"></div>
        <div style="display:flex;gap:10px;align-items:center;justify-content:center;margin-top:12px;color:var(--mut);font-size:22px"><img src="${u(MARK)}" style="width:20px;opacity:.5">QOVA is not in the path</div></div>
    </div>
    ${bot("Non custodial · checked on chain", DISC)}`],

  ["05-mint-means-arrived", 1080, 1350, `${top("Canon · 04")}
    <div style="position:absolute;left:72px;right:72px;top:170px"><h1 style="font-size:92px">Mint green<br><span class=g>means it arrived.</span></h1></div>
    <div class=card style="left:72px;top:590px;width:936px;padding:10px 20px"><img src="${u(R + "/crop-rows.png")}"></div>
    <div style="position:absolute;left:72px;right:72px;top:1010px;font-size:26px;color:#5a5a58;line-height:1.45">Open links stay grey. A link turns mint only once the full amount is seen on Solana. Not before. Not a guess.</div>
    ${bot("Sample data · test build", DISC)}`],

  ["06-receipt", 1080, 1350, `${top("Every payment")}
    <div style="position:absolute;left:72px;top:330px;width:440px"><h1 style="font-size:84px">A receipt<br><span class=g>you can check.</span></h1>
    <p style="margin-top:32px;font-size:26px;line-height:1.45;color:#4a4a48">Every paid link keeps the transaction, the sender and the time. Open it on Solscan. Nobody has to take our word for it.</p></div>
    <div class=card style="left:548px;top:250px;width:470px;padding:4px 0"><img src="${u(R + "/crop-receipt.png")}"></div>
    ${bot("Sample data · test build", DISC)}`],

  ["07-dashboard", 1600, 1000, `${top("Sample data · test build")}
    <div style="position:absolute;left:72px;top:150px;width:1456px;display:flex;justify-content:space-between;align-items:flex-end">
      <h1 style="font-size:76px">Every link. <span class=g>One calm screen.</span></h1>
      <p style="font-size:21px;line-height:1.45;color:#4a4a48;width:440px">Sign in with a free message from your wallet. No password. Nothing to sign for money.</p></div>
    <div class=card style="left:200px;top:300px;width:1200px;height:760px;border-radius:22px"><img src="${u(R + "/dash-1440.png")}" style="width:1200px"></div>`],

  ["08-counter", 1080, 1350, `${top("For shops")}
    <div style="position:absolute;left:72px;top:170px;width:470px"><h1 style="font-size:88px">For the shop<br><span class=g>on the corner.</span></h1>
    <p style="margin-top:32px;font-size:26px;line-height:1.45;color:#4a4a48">Counter mode turns a link into a big QR. The screen stays on. When the USDC lands, it says so.</p></div>
    ${phone("counter-390.png", 590, 170, 420)}
    ${bot("Real screen · test build", DISC)}`],

  ["09-honest", 1080, 1350, `${top("Plainly")}
    <div style="position:absolute;left:72px;right:72px;top:170px"><h1 style="font-size:90px">$QOVA is a meme.<br><span class=g>The pay link is free<br>and works without it.</span></h1></div>
    <div style="position:absolute;left:72px;right:72px;top:720px">
      ${[["$QOVA is", "a memecoin"], ["$QOVA is not", "a dollar, a stablecoin or a promise"], ["Pay links use", "USDC, issued by Circle"], ["QOVA never", "holds, moves or converts your money"]].map(([a, b]) => `<div class=hair></div><div style="display:grid;grid-template-columns:320px 1fr;padding:30px 0;font-size:30px;letter-spacing:-.015em"><span class=g>${a}</span><span>${b}</span></div>`).join("")}<div class=hair></div></div>
    ${bot("Not financial advice", "Its price can go to zero")}`],

  ["10-link-one", 1080, 1350, `${top("Open thread · 01")}
    <div style="position:absolute;left:0;right:0;top:250px;text-align:center"><span class=m>The first link ever made</span>
    <div style="font-size:360px;letter-spacing:-.07em;font-weight:500;line-height:1;margin-top:40px">#1</div>
    <h1 style="font-size:64px;margin-top:40px">Who made it,<br><span class=g>and what was it for?</span></h1></div>
    ${bot("The Linked keep the list of firsts", "Reply with your guess")}`],
];

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [name, W, H, html] of posts) {
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  fs.writeFileSync(`${D}/tmp.html`, `<style>${base(W, H)}</style>${html}`); await p.goto(u(`${D}/tmp.html`), { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
  await p.screenshot({ path: `${D}/out/qova-${name}.png` }); await p.close();
}
await b.close(); console.log(fs.readdirSync(`${D}/out`).join("\n"));
