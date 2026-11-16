// 06 Product Void: one product alone in pure black or white space, all the colour on the product. Each product is the
// member's photo (Saagii's answer 1: a see-through background makes it a floating cut-out, any other photo a clean
// rounded card, both lit the same way: a soft light behind, a sheen that crosses it once, a reflection on the floor).
// It comes out of the void, settles and drifts 6% closer; between products the screen dips through the void for
// 0.5 s. One Inter headline rises 24 px above it, one line (a price or offer) under it in the product's own colour.
// No clips: prep makes a blank video as long as the products and words, and the page draws the void.
import { mkdirSync } from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { missing } from "./scripts/fonts.mjs";
import { probe, run, ffmpeg, photoPng } from "./scripts/media.mjs";

export const NAME = "product-void";
export const TALKS = false;

const SKILL_DIR = dirname(fileURLToPath(import.meta.url));
const FONT = join(SKILL_DIR, "fonts", "Inter[opsz,wght].ttf");
const VOIDS = { black: { bg: "#000000", ink: "#F5F5F7" }, white: { bg: "#FFFFFF", ink: "#1D1D1F" } }; // v1, the preview
const BOX = [432, 640]; // a product fits in 432x640 (40% of the width), centred on (540, 1030) (v1, the preview)
const HI = 1.1; // the picture is made 10% bigger than it shows, so the 6% push never enlarges it
const ROLES = ["headline", "line"];
// Row limits, from HarfBuzz advances of the bundled Inter (opsz 32) at the floor sizes look.js fits down to, so a row of
// the widest letter a Mongolian keyboard types still fits the 840 px safe width: headline 15 x 0.995 em (Ю, Inter 700
// at -0.025 em spacing) at 56 px = 836 px; line 26 x 0.999 em (Ю, Inter 400) at 32 px = 831 px. № (1.05 em) is wider
// and can still run past. Real words are much narrower: "Цаг захиалаарай" is 777 px at the full 100 px.
const ROW = { headline: 15, line: 26 }, ROWS = { headline: 2, line: 1 };
// seconds: half the dip through the void (out, then in), the fade to the void at the very end, a word's rise in and
// its fade out, a word's and a product's least time on screen
const T = { DIP: 0.25, END: 0.6, IN: 0.6, OUT: 0.4, TEXT: 1.2, PRODUCT: 2 };
const FALLBACK = "#8a8a8a"; // a black, white or grey product: no colour to borrow
const COLOUR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const ALPHA = /^(yuva|gbrap|ya\d|rgba|bgra|argb|abgr|pal8)/; // pixel formats that can carry transparency
const EPS = 1e-9;

const isNum = (n) => typeof n === "number" && Number.isFinite(n);
const frame = (t) => (t === Infinity ? t : Math.round(t * 30) / 30); // the frame look.js shows it on
const s2 = (t) => t.toFixed(2);
const r3 = (t) => Math.round(t * 1000) / 1000;
const quote = (t) => `"${String(t.text ?? "").trim().replace(/\s*\n\s*/g, " / ")}"`;

function rgbOf(hex) {
  if (typeof hex !== "string" || !COLOUR.test(hex)) throw new Error(`${JSON.stringify(hex)} is not a colour like "#E8A06A"`);
  const h = hex.length === 4 ? [...hex.slice(1)].map((c) => c + c).join("") : hex.slice(1);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
const hexOf = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const lum = (hex) => {
  const [r, g, b] = rgbOf(hex).map((v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
// WCAG contrast ratio of two colours, 1 to 21
export function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

function voidOf(look) {
  const v = look?.void ?? "black";
  if (!VOIDS[v]) throw new Error('look "void" must be "black" or "white"');
  return v;
}

// The product's own colour: a hue histogram (32 bins, weighted by saturation) of its opaque, saturated pixels, shown at
// v1's brightness (HSV 0.54, 0.91). A product with under 3% of such pixels (black, white, grey, clear) gets #8a8a8a.
export function accentOf(rgba, w, h) {
  if (!(Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0)) throw new Error("accentOf: the size must be whole pixels");
  if (!(rgba instanceof Uint8Array || rgba instanceof Uint8ClampedArray) || rgba.length !== w * h * 4)
    throw new Error("accentOf needs the picture's RGBA bytes (w x h x 4)");
  const bins = new Float64Array(32);
  let solid = 0, sat = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] <= 200) continue;
    solid++;
    const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2], max = Math.max(r, g, b), d = max - Math.min(r, g, b);
    if (max <= 60 || d / max <= 60 / 255) continue;
    const hue = ((max === r ? (g - b) / d : max === g ? 2 + (b - r) / d : 4 + (r - g) / d) * 60 + 360) % 360;
    bins[Math.floor(hue / 11.25) % 32] += d / max;
    sat++;
  }
  if (!solid || sat < 0.03 * solid) return FALLBACK;
  const hue = (bins.indexOf(Math.max(...bins)) + 0.5) * 11.25, f = (n) => {
    const k = (n + hue / 60) % 6;
    return 0.91 * (1 - 0.54 * Math.max(0, Math.min(k, 4 - k, 1)));
  };
  return hexOf([f(5), f(3), f(1)].map((x) => x * 255));
}

// A colour readable on the void (4.5:1): mixed toward white on black, toward black on white, as little as needed, which
// keeps its hue.
export function onVoid(hex, v) {
  if (!VOIDS[v]) throw new Error('the void must be "black" or "white"');
  const bg = VOIDS[v].bg, c = rgbOf(hex), to = v === "black" ? 255 : 0;
  const mix = (m) => hexOf(c.map((x) => x + (to - x) * m));
  if (contrast(mix(0), bg) >= 4.5) return mix(0);
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    if (contrast(mix(m), bg) >= 4.5) hi = m;
    else lo = m;
  }
  return mix(hi);
}

// Saagii's answer 1 ("just have them put in the photo"): a photo whose pixel format has alpha and that is see-through
// somewhere (1% of it or more) is a cut-out; any other is a card. An opaque RGBA file (a screenshot) is a card.
export function productMode(info) {
  if (typeof info?.pix_fmt !== "string" || !info.pix_fmt) throw new Error("productMode needs the photo's pixel format (pix_fmt)");
  if (!(isNum(info.clear) && info.clear >= 0 && info.clear <= 1)) throw new Error("productMode: clear must be a share of the picture, 0 to 1");
  return ALPHA.test(info.pix_fmt) && info.clear >= 0.01 ? "cutout" : "card";
}

// The box round what is opaque (alpha 128 or more) in an alpha plane w x h, and the share of see-through pixels. null
// when nothing is opaque.
export function alphaBox(a, w, h) {
  if (!(Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0 && a?.length === w * h))
    throw new Error("alphaBox: the size doesn't match the picture");
  let x0 = w, y0 = h, x1 = -1, y1 = -1, clear = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (a[y * w + x] < 128) { clear++; continue; }
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, clear: clear / (w * h) };
}

// The products in time order on the frame grid: the first on frame 0 (the thumbnail), none overlapping, each 2 s.
function productsOf(plan) {
  const list = plan.products;
  if (!Array.isArray(list) || !list.length || !list.every((p) => p && typeof p === "object"))
    throw new Error('"products" must be a list like [{"src": "raw/perfume.png", "start": 0, "end": 4.5}]');
  let prev = null;
  return list.map((p, k) => {
    const n = `product ${k + 1}`;
    if (typeof p.src !== "string" || !p.src.trim()) throw new Error(`${n} needs "src": the photo of the product`);
    if (!(isNum(p.start) && p.start >= 0)) throw new Error(`${n}: "start" must be seconds, 0 or more`);
    if (!(isNum(p.end) && p.end > p.start)) throw new Error(`${n}: "end" must be seconds, after its start`);
    const start = frame(p.start), end = frame(p.end);
    if (k === 0 && start > 0) throw new Error("the first frame is the Reels thumbnail: start product 1 at 0");
    if (prev && start < prev.end - EPS)
      throw new Error(`${n} starts at ${s2(start)} s, before product ${k} ends (${s2(prev.end)} s): products show one at a time`);
    if (end - start < T.PRODUCT - EPS)
      throw new Error(`${n} shows for ${s2(end - start)} s: a product needs ${T.PRODUCT} s at least (to come out of the ` +
        "void, be seen and go). Hold each product 3-5 s: slow is the point.");
    return (prev = { k, src: p.src, start, end });
  });
}

// The video's length: the last product's end, or a word's "end" after it (words on the void at the end).
function length(plan) {
  const ends = [...productsOf(plan).map((p) => p.end), ...(plan.texts ?? []).filter((t) => isNum(t.end)).map((t) => t.end)];
  return frame(Math.max(...ends));
}

export function validate(plan) {
  if (plan.clips !== undefined)
    throw new Error('this look takes "products" (one photo each, with its "start" and "end"), not "clips"');
  const lk = plan.look ?? {}, v = voidOf(lk);
  if (lk.accent !== undefined && lk.accent !== "auto") {
    if (!(typeof lk.accent === "string" && COLOUR.test(lk.accent))) throw new Error('look "accent" must be "auto" or a colour like "#E8A06A"');
    const c = contrast(lk.accent, VOIDS[v].bg), light = v === "white";
    if (c < 3)
      throw new Error(`look "accent" ${lk.accent} is too ${light ? "light" : "dark"} to read on ${v} (contrast ` +
        `${c.toFixed(1)}:1, 3:1 at least): pick a ${light ? "darker" : "lighter"} colour, or leave "accent" out to ` +
        "take the product's own colour");
  }
  for (const t of plan.texts ?? []) {
    if (!ROLES.includes(t.role)) throw new Error(`text role "${t.role}" is not used by this look. Use "headline" or "line".`);
    const text = String(t.text ?? "");
    if (!text.trim()) throw new Error(`a "${t.role}" text is empty`);
    if (t.start !== undefined && !(isNum(t.start) && t.start >= 0)) throw new Error(`${quote(t)}: "start" must be seconds, 0 or more`);
    if (t.end !== undefined && !(isNum(t.end) && t.end > (t.start ?? 0))) throw new Error(`${quote(t)} must end after it starts`);
    const rows = text.split("\n").map((r) => r.trim());
    if (rows.some((r) => !r)) throw new Error(`${quote(t)} has an empty row: remove the extra \\n`);
    if (rows.length > ROWS[t.role])
      throw new Error(t.role === "line" ? `${quote(t)}: a line is one row: remove the \\n and shorten it`
        : `${quote(t)} has ${rows.length} rows: a headline takes ${ROWS.headline} rows at most`);
    for (const row of rows)
      if ([...row].length > ROW[t.role])
        throw new Error(t.role === "headline"
          ? `"${row}" is too long for one headline row (${ROW.headline} characters at most): shorten it, or split it into 2 rows with \\n`
          : `"${row}" is too long for a line (${ROW.line} characters at most): shorten it`);
    const bad = missing(rows.join(""), FONT);
    if (bad.length) throw new Error(`${quote(t)} uses ${bad.join(" ")}, which Inter can't draw`);
  }
  schedule(plan, length(plan));
}

// No clips: a blank video as long as the products and words. The page draws the void itself, so only its length is
// baked in at prep (prepare checks it).
export function BLANK(plan) {
  validate(plan);
  return { dur: length(plan), color: voidOf(plan.look) };
}

// The products and the words on the frame grid. One of each role at a time (a later one ends the one before). `last`:
// it runs to the video's end, so it fades out with the video; `out`: when it fades out. `of`: the product a word
// starts over (or the one before it, on the void), whose colour a line takes.
export function schedule(plan, dur) {
  if (!(isNum(dur) && dur > 0)) throw new Error("the video's length must be seconds");
  dur = frame(dur); // ffprobe's 6 decimals can sit a hair off the last frame
  // what runs to the end fades out over its last 0.6 s, ending on the video's last frame ((n - 1) / 30), which is then
  // the bare void; anything else fades over its own last 0.25 s (a product's half of the dip) or 0.4 s (a word)
  const lastFrame = frame(dur - 1 / 30), toEnd = [lastFrame - T.END, lastFrame];
  const products = productsOf(plan).map((p) => {
    if (p.end > dur + EPS) throw new Error(`product ${p.k + 1} ends at ${s2(p.end)} s, after the video ends (${s2(dur)} s)`);
    const last = p.end >= dur - EPS;
    return { ...p, last, out: last ? toEnd : [p.end - T.DIP, p.end] };
  });
  const items = [];
  for (const role of ROLES) {
    const order = (plan.texts ?? []).filter((t) => t.role === role).sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    order.forEach((t, k) => {
      const start = frame(t.start ?? 0), next = order[k + 1];
      if (start >= dur) throw new Error(`${quote(t)} starts at ${s2(t.start ?? 0)} s, after the video ends (${s2(dur)} s)`);
      const end = frame(Math.min(t.end ?? Infinity, next?.start ?? Infinity, dur));
      if (end - start < T.TEXT - EPS)
        throw new Error(`${quote(t)} shows for ${s2(end - start)} s: a ${role} needs ${T.TEXT} s (to rise in, be read ` +
          `and go). Move its start or end${next ? `, or the next ${role}'s start` : ""}.`);
      const text = String(t.text).trim();
      const of = products.reduce((o, p) => (p.start <= start + EPS ? p.k : o), 0);
      const last = end >= dur - EPS;
      items.push({ role, text, rows: text.split("\n").map((r) => r.trim()), start, end, last, of, out: last ? toEnd : [end - T.OUT, end] });
    });
  }
  items.sort((a, b) => a.start - b.start || ROLES.indexOf(a.role) - ROLES.indexOf(b.role));
  return { products, items };
}

// One product's picture as hf/products/product-<k>.png, made fresh on every render (a second or so), so it always
// matches the plan: the photo made upright (photoPng: a phone's EXIF turn, a whole HEIC), cropped at full size to what
// is opaque when it is a cut-out, and scaled once to fit 432x640. Its sheen is product-<k>-sheen.png: white where the
// product is solid, so the sheen never whitens see-through glass or the void round it. The look (where it is opaque, its
// colour) is read from a copy at most 1200 px wide.
async function makeProduct(p, ctx) {
  const path = resolve(ctx.planDir, p.src), name = basename(path), n = `product ${p.k + 1} (${name})`;
  const info = await probe(path);
  if (!info.video) throw new Error(`${n} is a sound file: give a photo of the product`);
  if (!info.still) throw new Error(`${n} is a video: give a photo of the product (a still of its best moment works)`);
  const photo = join(ctx.work, "photos", `product-${p.k}.png`);
  const { w: W, h: H, pix_fmt } = await photoPng(path, photo);
  const k0 = Math.min(1, 1200 / Math.max(W, H));
  const w = Math.max(1, Math.round(W * k0)), h = Math.max(1, Math.round(H * k0));
  const raw = await run("ffmpeg", ["-v", "error", "-i", photo, "-frames:v", "1", "-vf", `scale=${w}:${h}:flags=lanczos,format=rgba`,
    "-f", "rawvideo", "-"], { binary: true });
  if (raw.code || raw.stdout.length < w * h * 4)
    throw new Error(`could not read a picture from ${name}: ${String(raw.stderr).trim().slice(-300)}`);
  const px = new Uint8Array(raw.stdout.buffer, raw.stdout.byteOffset, w * h * 4);
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = px[i * 4 + 3];
  const box = alphaBox(alpha, w, h);
  if (!box) throw new Error(`${n} is see-through all over: nothing to show`);
  const mode = productMode({ pix_fmt, clear: box.clear });
  // the opaque box in the full-size photo (a pixel of the small copy covers W / w of it)
  const x0 = Math.floor((box.x * W) / w), y0 = Math.floor((box.y * H) / h);
  const c = mode === "cutout" ? { x: x0, y: y0, w: Math.min(W, Math.ceil(((box.x + box.w) * W) / w)) - x0,
    h: Math.min(H, Math.ceil(((box.y + box.h) * H) / h)) - y0 } : { x: 0, y: 0, w: W, h: H };
  const k = Math.min(BOX[0] / c.w, BOX[1] / c.h);
  const dw = Math.max(1, Math.round(c.w * k)), dh = Math.max(1, Math.round(c.h * k));
  const dir = join(ctx.hfDir, "products"), pic = join(dir, `product-${p.k}.png`);
  mkdirSync(dir, { recursive: true });
  await ffmpeg(["-i", photo, "-frames:v", "1", "-vf", `crop=${c.w}:${c.h}:${c.x}:${c.y},` +
    `scale=${Math.round(dw * HI)}:${Math.round(dh * HI)}:flags=lanczos,format=rgba`, pic], `make the picture of ${n}`);
  await ffmpeg(["-i", pic, "-frames:v", "1", "-vf", "format=rgba,lutrgb=r=255:g=255:b=255:a='clip((val-128)*2,0,255)'",
    join(dir, `product-${p.k}-sheen.png`)], `make the sheen of ${n}`);
  console.log(mode === "cutout" ? `[goat] ${n}: a see-through background, so it floats as a cut-out`
    : `[goat] ${n}: no see-through background, so it shows as a rounded card. To float the product on its own, give ` +
      "the photo with its background removed (Copy Subject on the phone, Remove Background on a Mac).");
  return { mode, w: dw, h: dh, accent: accentOf(px, w, h) };
}

// HyperFrames waits for the pictures in the page's HTML, so they go into index.html ({{PRODUCTS}}): each product's
// scene holds its light, its floor, its reflection, the picture and its sheen (its white copy, seen through a moving band).
export async function prepare(ctx) {
  const want = length(ctx.plan);
  if (Math.abs(want - ctx.dur) > 1 / 60)
    throw new Error(`the products and words now end at ${s2(want)} s but the video is ${s2(ctx.dur)} s long: run "prep" ` +
      "again (prep makes the empty video as long as the products and words)");
  const v = voidOf(ctx.plan.look), s = schedule(ctx.plan, ctx.dur);
  const given = ctx.plan.look?.accent && ctx.plan.look.accent !== "auto" ? ctx.plan.look.accent : null;
  const products = [];
  for (const p of s.products) products.push({ ...p, ...(await makeProduct(p, ctx)) });
  const items = s.items.map((t) => ({ ...t, color: t.role === "line" ? given ?? onVoid(products[t.of].accent, v) : VOIDS[v].ink }));
  // one <img> per product (HyperFrames drops duplicate media nodes); the reflection and the sheen paint the same file
  const src = (p, x = "") => `products/product-${p.k}${x}.png`, bg = (f) => `style="background-image: url(${f})"`;
  const PRODUCTS = products.map((p) => `<div class="scene ${p.mode}" id="scene-${p.k}"><div class="spot"></div>` +
    `<div class="push"><div class="enter"><div class="floor"></div><div class="refl"><div class="flip" ${bg(src(p))}></div></div>` +
    `<div class="prod"><img src="${src(p)}" width="${p.w}" height="${p.h}" alt=""><div class="sheen" ${bg(src(p, "-sheen"))}></div></div>` +
    `</div></div></div>`).join("\n");
  return { void: v, bg: VOIDS[v].bg, products, items, T, html: { PRODUCTS } };
}

// v1's events at about 30% of its levels (Saagii, 15 Nov: half was still "a bit too much" on 08); members raise them
// with "sfx": {"volume": …}. A whoosh as each product after the first comes out of the void, a soft low thud as a line
// lands. Nothing for what is on screen at frame 0, and never two within 0.5 s (the earlier one plays).
export function sfx(plan, ctx) {
  const s = schedule(plan, ctx.dur);
  const ev = [
    ...s.products.filter((p) => p.start > EPS).map((p) => ({ sound: "whoosh", at: r3(Math.max(0, p.start - 0.1)), volume: 0.15 })),
    ...s.items.filter((t) => t.role === "line" && t.start > EPS).map((t) => ({ sound: "thud", at: r3(t.start), volume: 0.15 })),
  ].sort((a, b) => a.at - b.at);
  let last = -Infinity;
  return ev.filter((e) => e.at - last >= 0.5 - EPS && ((last = e.at), true));
}
