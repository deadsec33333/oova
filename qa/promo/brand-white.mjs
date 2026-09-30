// White only X profile set from the supplied website mark (brand/qova-mark-black.svg), unchanged.
import { createRequire } from "node:module"; import fs from "node:fs";
const require = createRequire("/home/claude/q/web/package.json");
const { chromium } = require("/home/claude/.npm-global/lib/node_modules/playwright");
const D = "/home/claude/brandw";
const font = `@font-face{font-family:G;src:url(file://${D}/geist.woff2)}@font-face{font-family:GM;src:url(file://${D}/geistmono.woff2)}*{margin:0;box-sizing:border-box}body{background:#fff;overflow:hidden}`;
// the mark's shape spans 6..38 in its 4..44 viewBox; crop the viewBox to the shape so it centres optically
const mark = (px) => `<img src="file://${D}/mark.svg" style="width:${px * 40 / 32}px;height:${px * 40 / 32}px;margin:${-px * 2 / 32}px ${-px * 6 / 32}px ${-px * 6 / 32}px ${-px * 2 / 32}px;display:block">`;
const pages = {
  "qova-pfp-white": [1024, 1024, `<style>${font} body{width:1024px;height:1024px;display:grid;place-items:center}</style><div style="width:532px;height:532px;overflow:visible">${mark(532)}</div>`],
  "qova-x-banner-white": [1500, 500, `<style>${font}
    body{width:1500px;height:500px;position:relative;font-family:G;color:#0a0a0a}
    .lock{position:absolute;left:50%;top:205px;transform:translate(-50%,-50%);display:flex;align-items:center;gap:44px}
    .word{font-weight:600;letter-spacing:.24em;font-size:104px;line-height:1;margin-right:-.24em;padding-top:4px}
    .tag{position:absolute;left:0;right:0;top:330px;text-align:center;font-size:34px;letter-spacing:-.02em;color:#0a0a0a}
    .tag span{color:#8a8a8a}
    .f{position:absolute;right:36px;bottom:22px;font-family:GM;font-size:11.5px;letter-spacing:.06em;color:#9a9a9a}</style>
    <div class=lock><div style="width:150px;height:150px">${mark(150)}</div><div class=word>QOVA</div></div>
    <p class=tag>Dollars for everyone. <span>One link away.</span></p>
    <p class=f>$QOVA is a memecoin, not a dollar. Pay links use USDC.</p>`],
};
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [name, [w, h, html]] of Object.entries(pages)) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  fs.writeFileSync(`${D}/tmp.html`, html); await p.goto(`file://${D}/tmp.html`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
  await p.screenshot({ path: `${D}/${name}.png` }); await p.close();
}
await b.close();
