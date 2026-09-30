// Transparent PNG of the site's chrome coin (with the supplied mark), for white posts.
import { chromium, BASE } from "./lib.mjs";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [name, ry, rx] of [["coin-front", -10, 6], ["coin-tilt", -34, 10]]) {
  const p = await b.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 2 });
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.evaluate(({ ry, rx }) => {
    const st = document.querySelector(".coin-stage");
    const s = document.createElement("style");
    s.textContent = `html,body{background:transparent!important;overflow:hidden!important} body>*{visibility:hidden} #bx,#bx *{visibility:visible}
      #bx{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:transparent}
      #bx .coin3d{animation:none!important;transform:rotateY(${ry}deg) rotateX(${rx}deg)!important}
      #bx .coin-tilt{transform:none!important;transition:none!important}
      #bx .c-shine::before{animation:none!important;left:20%!important}
      #bx .c-holo{animation:none!important;transform:rotate(40deg)} #bx .c-rose{animation:none!important}
      #bx .coin-shadow{display:none} #bx .coin-stage{opacity:1!important;animation:none!important}
      #coin{zoom:2.2;filter:drop-shadow(0 8px 10px rgba(0,0,0,.16)) drop-shadow(0 30px 40px rgba(0,0,0,.14))}`;
    document.head.appendChild(s);
    const bx = document.createElement("div"); bx.id = "bx"; bx.innerHTML = "<div id=coin></div>"; document.body.appendChild(bx);
    const c = st.cloneNode(true); c.removeAttribute("style"); c.querySelectorAll("[style]").forEach((e) => { if (!e.classList.contains("c-edge")) e.removeAttribute("style"); });
    c.style.width = c.style.height = "240px"; c.style.setProperty("--t", "20px");
    [...c.querySelectorAll(".c-edge")].forEach((e, i, a) => { e.style.transform = `translateZ(${(-10 + (20 * i) / (a.length - 1)).toFixed(2)}px)`; });
    c.querySelectorAll(".c-rimtxt textPath").forEach((tp) => { tp.textContent = tp.textContent.slice(0, tp.textContent.length / 2); tp.setAttribute("textLength", "498"); tp.setAttribute("lengthAdjust", "spacing"); });
    bx.querySelector("#coin").appendChild(c);
  }, { ry, rx });
  await p.waitForTimeout(500);
  await p.screenshot({ path: `/home/claude/white/raw/${name}.png`, omitBackground: true }); await p.close();
}
await b.close(); console.log("ok");
