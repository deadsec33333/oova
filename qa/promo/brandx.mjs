// X profile picture + banner, rendered from the site's own chrome coin (uses the supplied mark).
import { chromium, BASE } from "./lib.mjs";
const OUT = "/home/claude/brandx";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

async function render(name, W, H, dsf, html, css, coin) {
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: dsf });
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.evaluate(({ html, css, coin }) => {
    const st = document.querySelector(".coin-stage");
    const s = document.createElement("style");
    s.textContent = `html,body{overflow:hidden!important} #bx{position:fixed;inset:0;z-index:2147483647;overflow:hidden}
      #bx .coin3d{animation:none!important;transform:rotateY(${coin.ry}deg) rotateX(${coin.rx}deg)!important}
      #bx .coin-tilt{transform:none!important;transition:none!important}
      #bx .c-shine::before{animation:none!important;left:${coin.shine}%!important}
      #bx .c-holo{animation:none!important;transform:rotate(${coin.holo}deg)}
      #bx .coin-shadow{display:none} #bx .coin-stage{opacity:1!important;animation:none!important;translate:none!important;scale:none!important;visibility:visible!important} ${css}`;
    document.head.appendChild(s);
    const bx = document.createElement("div"); bx.id = "bx"; bx.innerHTML = html; document.body.appendChild(bx);
    const slot = bx.querySelector("#coin"); const c = st.cloneNode(true); c.removeAttribute("style"); c.querySelectorAll("[style]").forEach((e) => { if (!e.classList.contains("c-edge")) e.removeAttribute("style"); });
    c.style.width = c.style.height = "240px"; c.style.setProperty("--t", "20px");
    [...c.querySelectorAll(".c-edge")].forEach((e, i, a) => { e.style.transform = `translateZ(${(-10 + (20 * i) / (a.length - 1)).toFixed(2)}px)`; });
    // rim text: one copy stretched to the exact circumference, so the seam never overlaps
    c.querySelectorAll(".c-rimtxt textPath").forEach((tp) => { const one = tp.textContent.slice(0, tp.textContent.length / 2); tp.textContent = one; tp.setAttribute("textLength", "498"); tp.setAttribute("lengthAdjust", "spacing"); });
    slot.appendChild(c);
  }, { html, css, coin });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/${name}.png` }); await p.close();
}

const pfpCss = (bg, glow) => `#bx{background:${bg};display:grid;place-items:center}
  #bx:before{content:"";position:absolute;inset:0;background:${glow}}
  #coin{zoom:3.05;position:relative;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45)) drop-shadow(0 18px 30px rgba(0,0,0,.35))}`;
const pfpCoin = { ry: -13, rx: 7, shine: 18, holo: 40 };
await render("qova-pfp-dark", 1024, 1024, 2, `<div id=coin></div>`, pfpCss("#0a0a0a", "radial-gradient(circle at 50% 42%, rgba(255,255,255,.16), transparent 58%), radial-gradient(circle at 50% 100%, rgba(61,220,151,.22), transparent 55%)"), pfpCoin);
await render("qova-pfp-light", 1024, 1024, 2, `<div id=coin></div>`, pfpCss("#f3f3f1", "radial-gradient(circle at 50% 40%, #ffffff, transparent 60%), radial-gradient(circle at 50% 100%, rgba(61,220,151,.20), transparent 55%)").replace("rgba(0,0,0,.45)", "rgba(0,0,0,.25)").replace("rgba(0,0,0,.35)", "rgba(0,0,0,.18)"), pfpCoin);
await render("qova-pfp-mint", 1024, 1024, 2, `<div id=coin></div>`, pfpCss("#3ddc97", "radial-gradient(circle at 50% 40%, rgba(255,255,255,.45), transparent 60%)").replace("rgba(0,0,0,.45)", "rgba(4,21,13,.35)").replace("rgba(0,0,0,.35)", "rgba(4,21,13,.3)"), pfpCoin);

// Banner 1500x500. Desktop: the avatar sits over the bottom left, so text stays high and the coin lives on the right.
const banner = (dark) => {
  const fg = dark ? "#f2f2f2" : "#0b0b0b", mut = dark ? "#8a8a8a" : "#707070", bg = dark ? "#0a0a0a" : "#f6f6f4";
  return [`<div class=k><i></i>USDC pay links on Solana · wallet to wallet</div>
  <h1>Dollars for everyone.<br><span>One link away.</span></h1>
  <div class=line></div><div id=coin></div>
  <div class=f>$QOVA is a memecoin, not a dollar. Pay links use USDC. QOVA never holds your money.</div>`,
  `#bx{background:${bg};color:${fg};font-family:var(--font-geist-sans),sans-serif}
  #bx:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 520px 380px at 1170px 250px, ${dark ? "rgba(255,255,255,.10)" : "#fff"}, transparent 70%), radial-gradient(ellipse 700px 240px at 1170px 520px, rgba(61,220,151,${dark ? ".16" : ".14"}), transparent 70%)}
  #bx:after{content:"";position:absolute;inset:0;background-image:radial-gradient(${dark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.06)"} 1px, transparent 1.3px);background-size:14px 14px;mask-image:linear-gradient(90deg,transparent 0,transparent 45%,#000 75%);-webkit-mask-image:linear-gradient(90deg,transparent 0,transparent 45%,#000 75%);pointer-events:none}
  .k{position:absolute;left:96px;top:92px;font-family:var(--font-geist-mono),monospace;font-size:15px;letter-spacing:.16em;text-transform:uppercase;color:${mut};display:flex;align-items:center;gap:12px}
  .k i{width:9px;height:9px;border-radius:50%;background:#3ddc97;box-shadow:0 0 0 4px rgba(61,220,151,.22)}
  h1{position:absolute;left:92px;top:128px;margin:0;font-size:78px;line-height:1.02;letter-spacing:-.045em;font-weight:500}
  h1 span{color:${mut}}
  .line{position:absolute;left:760px;right:330px;top:250px;height:1px;background:linear-gradient(90deg,transparent,${dark ? "rgba(255,255,255,.28)" : "rgba(0,0,0,.2)"});}
  .line:after{content:"";position:absolute;right:0;top:-3px;width:7px;height:7px;border-radius:50%;background:#3ddc97;box-shadow:0 0 12px #3ddc97}
  #coin{position:absolute;left:1170px;top:250px;transform:translate(-50%,-50%);zoom:1;width:0;height:0}
  #coin .coin-stage{zoom:1.42;position:absolute;left:-120px;top:-120px;filter:drop-shadow(0 10px 18px rgba(0,0,0,${dark ? ".55" : ".25"}))}
  .f{position:absolute;right:40px;bottom:22px;font-family:var(--font-geist-mono),monospace;font-size:11.5px;letter-spacing:.06em;color:${mut}}`];
};
for (const dark of [true, false]) { const [h, c] = banner(dark); await render(`qova-x-banner-${dark ? "dark" : "light"}`, 1500, 500, 2, h, c, { ry: -24, rx: 6, shine: 22, holo: 40 }); }
await b.close(); console.log("done");
