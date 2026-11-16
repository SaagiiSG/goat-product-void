// 06 Product Void. Reads window.PLAN (goat.mjs writes it; look.mjs times the products and words, makes each product's
// picture and its colour) and builds one paused GSAP timeline. The products are in index.html already (look.mjs writes
// them there, so the renderer waits for their pictures).
const P = window.PLAN, T = P.T, D = P.dur;
const tl = gsap.timeline({ paused: true });
const rng = GOAT.rng(6);
const EPS = 1e-6;

const CX = 540, CY = 1030; // the product's centre (v1, the preview)
const HEAD_BOTTOM = 508, LINE_TOP = 566; // the headline's last row ends, the line starts (preview .h top 21%, .s 29.5%)
const root = document.getElementById("root");
root.classList.add(P.void);
root.style.setProperty("--void", P.bg);
document.body.style.background = P.bg;
const rgba = (hex, a) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",")},${a})`;

// The dips through the void are the look's only flashes: never two within 1/3 s (look.mjs keeps products 2 s apart).
const changes = P.products.filter((p) => p.start > EPS).map((p) => p.start);
if (GOAT.spaced(changes, 1 / 3).length !== changes.length) throw new Error("two dips through the void within 1/3 s");

for (const p of P.products) {
  const sc = document.getElementById(`scene-${p.k}`), q = (s) => sc.querySelector(s);
  const push = q(".push"), enter = q(".enter"), spot = q(".spot"), floor = q(".floor"), sheen = q(".sheen");
  const base = CY + p.h / 2, px = (n) => `${Math.round(n * 100) / 100}px`;
  const box = (el, x, y, w, h) => Object.assign(el.style, { left: px(x), top: px(y), width: px(w), height: px(h) });
  box(q(".prod"), CX - p.w / 2, CY - p.h / 2, p.w, p.h);
  box(q(".refl"), CX - p.w / 2, base + 3, p.w, p.h);
  box(floor, CX - p.w * 0.75, base - 46, p.w * 1.5, 92);
  // the light: an ellipse round the product, brightest behind it, in its own colour (grey for a colourless one)
  const sw = Math.max(760, p.w * 2.1), sh = Math.max(900, p.h * 1.75);
  box(spot, CX - sw / 2, CY - 60 - sh / 2, sw, sh);
  spot.style.background = `radial-gradient(closest-side, ${rgba(p.accent, 0.22)}, ${rgba(p.accent, 0.08)} 55%, ${rgba(p.accent, 0)})`;
  gsap.set([push, enter], { transformOrigin: `${CX}px ${CY}px`, force3D: false });

  // In: out of the void (the dip's second half) while it rises 28 px, grows from 96.5% and comes into focus, settling
  // over a second; the light comes up a little slower behind it. A product on frame 0 is simply there.
  const first = p.start < EPS, len = p.end - p.start;
  gsap.set(sc, { opacity: first ? 1 : 0, visibility: first ? "visible" : "hidden" });
  if (!first) {
    tl.set(sc, { visibility: "visible" }, p.start);
    tl.fromTo(sc, { opacity: 0 }, { opacity: 1, duration: T.DIP, ease: "power1.out", immediateRender: false }, p.start);
    tl.fromTo(enter, { y: 28, scale: 0.965 }, { y: 0, scale: 1, duration: 1, ease: "power3.out", immediateRender: false }, p.start);
    tl.fromTo(enter, { filter: "blur(10px)" }, { filter: "blur(0px)", duration: 0.5, ease: "power2.out", immediateRender: false }, p.start);
    tl.fromTo(spot, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "sine.out", immediateRender: false }, p.start);
  }
  // The push: 6% closer over 5 s, eased (a shorter shot pushes less, so every shot moves at one speed; v1), about the
  // product's centre. The light drifts 48 px sideways (seeded direction) over the shot, slower than the product.
  tl.fromTo(push, { scale: 1 }, { scale: 1 + (0.06 * Math.min(len, 5)) / 5, duration: len, ease: "sine.inOut", immediateRender: false }, p.start);
  const dir = rng() < 0.5 ? -1 : 1;
  tl.fromTo(spot, { x: -24 * dir }, { x: 24 * dir, duration: len, ease: "sine.inOut", immediateRender: false }, p.start);
  // The sheen crosses once, once the product has settled, if there is time before it goes.
  const [o0, o1] = p.out, at = p.start + (first ? 0.5 : 0.7);
  if (at + 1.3 <= o0 + EPS)
    tl.fromTo(sheen, { "--sheen": "100%" }, { "--sheen": "0%", duration: 1.3, ease: "power2.inOut", immediateRender: false }, at);
  // Out: back into the void (the dip's first half, or the video's last 0.6 s, gone on its last frame), pushing on
  // through it and softening.
  tl.fromTo(sc, { opacity: 1 }, { opacity: 0, duration: o1 - o0, ease: "power1.in", immediateRender: false }, o0);
  tl.fromTo(enter, { scale: 1, filter: "blur(0px)" }, { scale: 1.03, filter: "blur(6px)", duration: o1 - o0, ease: "power1.in", immediateRender: false }, o0);
  if (!p.last) tl.set(sc, { visibility: "hidden" }, p.end);
}

// The words: each rises 24 px into place over 0.6 s, coming into focus (preview: .h and .s rise 24 px); goes over 0.4 s,
// or with the video in its last 0.6 s (look.mjs's `out`). One up on frame 0 is already there.
const HIDDEN = { opacity: 0, y: 24, filter: "blur(6px)" }, SHOWN = { opacity: 1, y: 0, filter: "blur(0px)" };
const GONE = { opacity: 0, y: -8, filter: "blur(4px)" };
const words = P.items.map((it) => {
  const el = document.getElementById("words").appendChild(document.createElement("div"));
  el.className = it.role;
  el.style.color = it.color;
  for (const r of it.rows) el.appendChild(document.createElement("div")).textContent = r;
  gsap.set(el, { xPercent: -50, force3D: false });
  const up = it.start < EPS, [o0, o1] = it.out;
  gsap.set(el, up ? SHOWN : HIDDEN);
  if (!up) tl.fromTo(el, HIDDEN, { ...SHOWN, duration: T.IN, ease: "power3.out", immediateRender: false }, it.start);
  tl.fromTo(el, SHOWN, { ...GONE, duration: o1 - o0, ease: "power2.in", immediateRender: false }, o0);
  return { it, el };
});

tl.set({}, {}, D);
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;

// Sizes need the real font; the renderer waits for document.fonts.ready before the first frame. Each row fits the
// 840 px safe width, down to the floors look.mjs's row limits are measured at (headline 56 px, line 32 px). The
// headline's rows stack upward from y 508 (line-height 1.05), so two rows at 100 px start at y 298, inside the safe box.
function layout() {
  for (const { it, el } of words) {
    if (it.role === "headline") {
      const s = GOAT.fit(el, 840, 100, 56);
      el.style.top = `${HEAD_BOTTOM - it.rows.length * 1.05 * s}px`;
    } else {
      GOAT.fit(el, 840, 56, 32);
      el.style.top = `${LINE_TOP}px`;
    }
  }
}
layout();
document.fonts.ready.then(layout);
