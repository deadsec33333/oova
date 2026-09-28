import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire("/home/claude/q/web/package.json");
const { chromium } = require("/home/claude/.npm-global/lib/node_modules/playwright");
const D = "/home/claude/promo"; fs.mkdirSync(`${D}/out`, { recursive: true });
const steps = [
  { img: "01b-switch.png", n: "01", t: "Make a link", s: "Card payments are one switch per link." },
  { img: "03-card.png", n: "02", t: "They pay by card", s: "Card, Apple Pay or Google Pay. No wallet needed." },
  { img: "04-paid.png", n: "03", t: "Checked on Solana", s: "Paid only shows once the USDC has landed." },
  { img: "05-toast.png", n: "04", t: "USDC in your wallet", s: "Straight to you. QOVA never holds it." },
];
const pal = {
  dark: { bg: "#070707", bg2: "#111", fg: "#f2f2f2", mut: "#8a8a8a", line: "#262626", frame: "#1b1b1b" },
  light: { bg: "#f4f4f2", bg2: "#fff", fg: "#0b0b0b", mut: "#6b6b6b", line: "#dcdcd8", frame: "#e6e6e2" },
};
const FOOT = "Preview from the QOVA test build. Sample data, fees hidden. Card payments are not live yet. $QOVA is a memecoin, not a dollar.";
const css = (c) => `
@font-face{font-family:G;src:url(file://${D}/geist.woff2)}@font-face{font-family:GM;src:url(file://${D}/geistmono.woff2)}
*{box-sizing:border-box;margin:0}body{background:${c.bg};color:${c.fg};font-family:G;overflow:hidden;
background-image:radial-gradient(ellipse at 50% 120%, rgba(61,220,151,.10), transparent 55%)}
.mono{font-family:GM;letter-spacing:.12em;text-transform:uppercase}
.kick{display:inline-flex;align-items:center;gap:10px;color:${c.mut};font-size:15px}
.kick i{width:9px;height:9px;border-radius:50%;background:#3ddc97;box-shadow:0 0 0 4px rgba(61,220,151,.2)}
.phone{border-radius:44px;padding:9px;background:${c.frame};box-shadow:0 30px 70px rgba(0,0,0,.35),inset 0 0 0 1px ${c.line}}
.phone img{display:block;width:100%;border-radius:36px}
.foot{position:absolute;left:0;right:0;bottom:22px;text-align:center;color:${c.mut};font-size:13px}
.num{color:#3ddc97;font-size:13px}`;
const flow = (c, t) => `<style>${css(c)}
.wrap{width:1600px;height:900px;position:relative;padding:56px 70px}
h1{font-size:62px;letter-spacing:-.035em;font-weight:560;line-height:1;margin-top:16px}
h1 span{color:${c.mut}}
.row{display:flex;gap:34px;margin-top:44px;justify-content:center}
.col{width:330px}.col .phone{height:520px;overflow:hidden}
.cap{margin-top:18px}.cap b{display:block;font-size:22px;font-weight:560;margin-top:6px;letter-spacing:-.01em}.cap p{color:${c.mut};font-size:16px;margin-top:4px}
.row .phone{height:520px}.row .phone img{height:502px;object-fit:cover;object-position:top}
</style><div class=wrap><span class="kick mono"><i></i>Coming soon to QOVA pay links</span>
<h1>Get paid in USDC. <span>They pay by card.</span></h1>
<div class=row>${steps.map((s) => `<div class=col><div class=phone><img src="${D}/raw-${t}/${s.img}"></div><div class=cap><span class="num mono">${s.n}</span><b>${s.t}</b><p>${s.s}</p></div></div>`).join("")}</div>
<p class=foot>${FOOT}</p></div>`;
const single = (c, t, s) => `<style>${css(c)}
.wrap{width:1080px;height:1350px;position:relative;padding:70px 80px;display:flex;flex-direction:column;align-items:center;text-align:center}
h1{font-size:64px;letter-spacing:-.035em;font-weight:560;margin-top:18px}p.s{color:${c.mut};font-size:26px;margin-top:12px}
.phone{width:470px;margin-top:48px;height:900px;overflow:hidden}.phone img{height:882px;object-fit:cover;object-position:top}
</style><div class=wrap><span class="kick mono"><i></i>${s.n} / 04 · QOVA card payments</span><h1>${s.t}</h1><p class=s>${s.s}</p>
<div class=phone><img src="${D}/raw-${t}/${s.img}"></div><p class=foot>${FOOT}</p></div>`;

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const t of ["dark", "light"]) {
  const c = pal[t];
  let p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
  fs.writeFileSync(`${D}/tmp.html`, flow(c, t)); await p.goto(`file://${D}/tmp.html`, { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${D}/out/qova-card-flow-${t}.png` }); await p.close();
  for (const s of steps) {
    p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    fs.writeFileSync(`${D}/tmp.html`, single(c, t, s)); await p.goto(`file://${D}/tmp.html`, { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${D}/out/qova-card-step${s.n}-${t}.png` }); await p.close();
  }
}
await b.close(); console.log(fs.readdirSync(`${D}/out`).join("\n"));
