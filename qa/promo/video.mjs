// Vertical 1080x1920 clip: real 2x screens from the test build, joined with smooth transitions.
import { createRequire } from "node:module";
import fs from "node:fs"; import { execSync } from "node:child_process";
const require = createRequire("/home/claude/q/web/package.json");
const { chromium } = require("/home/claude/.npm-global/lib/node_modules/playwright");
const D = "/home/claude/promo";
const pal = { dark: { bg: "#070707", fg: "#f2f2f2", mut: "#8a8a8a", line: "#262626", frame: "#1b1b1b" }, light: { bg: "#f4f4f2", fg: "#0b0b0b", mut: "#6b6b6b", line: "#dcdcd8", frame: "#e6e6e2" } };
const FOOT = "Preview from the QOVA test build. Sample data, fees hidden.<br>Card payments are not live yet. $QOVA is a memecoin, not a dollar.";
const scenes = [
  { img: "02-pay.png", n: "01", t: "Send a pay link", s: "25 USDC for a logo. They open it on their phone.", d: 2.6 },
  { img: "03-card.png", n: "02", t: "They pay by card", s: "Card, Apple Pay or Google Pay. No wallet needed.", d: 3.2 },
  { img: "04-paid.png", n: "03", t: "Checked on Solana", s: "Paid only shows once the USDC has landed.", d: 2.6 },
  { img: "05-toast.png", n: "04", t: "USDC in your wallet", s: "Straight to you. QOVA never holds it.", d: 3.2 },
  { end: true, d: 3.0 },
];
const frame = (c, t, s) => `<style>@font-face{font-family:G;src:url(file://${D}/geist.woff2)}@font-face{font-family:GM;src:url(file://${D}/geistmono.woff2)}
*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:${c.bg};color:${c.fg};font-family:G;text-align:center;position:relative;overflow:hidden;background-image:radial-gradient(ellipse at 50% 110%, rgba(61,220,151,.13), transparent 55%)}
.k{font-family:GM;letter-spacing:.14em;text-transform:uppercase;color:${c.mut};font-size:22px;display:flex;gap:12px;justify-content:center;align-items:center}.k i{width:12px;height:12px;border-radius:50%;background:#3ddc97;box-shadow:0 0 0 5px rgba(61,220,151,.2)}
.top{padding-top:84px}h1{font-size:78px;letter-spacing:-.035em;font-weight:560;margin-top:24px;line-height:1.02}p.s{color:${c.mut};font-size:31px;margin-top:16px;padding:0 90px}
.ph{position:absolute;left:210px;top:350px;width:660px;height:1330px;border-radius:58px;padding:12px;background:${c.frame};box-shadow:0 40px 90px rgba(0,0,0,.4),inset 0 0 0 1px ${c.line};overflow:hidden}
.ph img{width:636px;height:1306px;object-fit:cover;object-position:top;border-radius:47px;display:block}
.f{position:absolute;bottom:40px;left:0;right:0;color:${c.mut};font-size:20px;line-height:1.5}
.end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 90px}.end h1{font-size:96px}.end p{color:${c.mut};font-size:34px;margin-top:24px;line-height:1.35}</style>
${s.end ? `<div class=end><span class=k><i></i>Coming soon</span><h1>Get paid in USDC.<br><span style="color:${c.mut}">They pay by card.</span></h1><p>QOVA pay links on Solana.<br>No custody. No card data. Just your wallet.</p></div>`
: `<div class=top><span class=k><i></i>${s.n} / 04 · QOVA card payments</span><h1>${s.t}</h1><p class=s>${s.s}</p></div><div class=ph><img src="file://${D}/raw-${t}/${s.img}"></div>`}<div class=f>${FOOT}</div>`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const X = 0.5; // transition seconds
for (const theme of ["dark", "light"]) {
  const pngs = [];
  for (const [i, s] of scenes.entries()) {
    const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    fs.writeFileSync(`${D}/tmp.html`, frame(pal[theme], theme, s)); await pg.goto(`file://${D}/tmp.html`, { waitUntil: "load" }); await pg.evaluate(() => document.fonts.ready);
    const f = `${D}/tmp-${theme}-${i}.png`; await pg.screenshot({ path: f }); await pg.close(); pngs.push(f);
    if (!s.end) fs.copyFileSync(f, `${D}/out/qova-card-story${s.n}-${theme}.png`);
  }
  const ins = scenes.map((s, i) => `-loop 1 -t ${s.d + X} -framerate 30 -i ${pngs[i]}`).join(" ");
  let fc = "", prev = "[0:v]", off = 0;
  const kinds = ["slideleft", "slideleft", "slideleft", "fade"];
  for (let i = 1; i < scenes.length; i++) { off += scenes[i - 1].d; const o = `[v${i}]`; fc += `${prev}[${i}:v]xfade=transition=${kinds[i - 1]}:duration=${X}:offset=${off.toFixed(2)}${o};`; prev = o; }
  fc += `${prev}format=yuv420p,fade=t=in:st=0:d=0.3[out]`;
  execSync(`ffmpeg -y -loglevel error ${ins} -filter_complex "${fc}" -map "[out]" -r 30 -c:v libx264 -crf 17 -preset slow -movflags +faststart ${D}/out/qova-card-flow-${theme}.mp4`);
}
await b.close();
console.log(execSync(`for f in ${D}/out/*.mp4; do echo $f $(ffprobe -v error -show_entries format=duration -of csv=p=0 $f) $(du -h $f | cut -f1); done`).toString());
