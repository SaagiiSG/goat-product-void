# /// script
# requires-python = ">=3.11,<3.13"
# dependencies = ["pillow>=10.4", "numpy", "scipy", "rembg[cpu]>=2.0.80,<3"]
# ///
"""Product Void · Хоосон дэвсгэр.

One product alone in pure black (or white) space: the product is cut out of its photo or clip, sits
small in the middle with a slow 6% push-in, all the colour on the product, one clean headline above
and one line (price) in a colour taken from the product.
Usage: uv run render.py plan.json
"""
import colorsys
import hashlib
import io
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import goatcut as g  # noqa: E402
from PIL import Image  # noqa: E402

NAME = "product-void"
W, H = g.W, g.H
VOIDS = {"black": ((0, 0, 0), (245, 245, 247, 255)), "white": ((255, 255, 255), (29, 29, 31, 255))}  # void, text
NEUTRAL = {"black": (161, 161, 166, 255), "white": (110, 110, 115, 255)}
BASE = "eq=contrast=1.06:saturation=1.03,curves=master='0/0 0.25/0.22 0.75/0.78 1/1'"
CRUSH = {"black": "curves=master='0/0 0.07/0 1/1'", "white": "curves=master='0/0 0.93/1 1/1'"}  # cloth -> pure void
BOX = (432, 640, 540, 1030)   # product fits in 432x640 (40% of the width), centred here
PUSH = 0.06                   # 1.00 -> 1.06 over 5 s, eased
INTER = "Inter[opsz,wght].ttf"
HEAD_Y, LINE_Y = 505, 566     # headline bottom, line top: the preview phone's layout, inside the safe box


def void(ctx):
    v = ctx.opt("void", "black")
    if v not in VOIDS:
        g.die(f'look.void must be one of {", ".join(VOIDS)}')
    return v


def cut_on(clip):
    v = clip.get("cut", True)
    if not isinstance(v, bool):
        g.die('a clip\'s "cut" must be true or false')
    return v


def FIT_SIZE(ctx):
    # cut-out clips are drawn from one frame, so the moving picture is only needed for uncut clips
    return (W, H) if not all(cut_on(c) for c in ctx.clips) else (108, 192)


def GRADE(ctx):
    return f"{BASE},{CRUSH[void(ctx)]}"


# ---------------------------------------------------------------- cut-outs

_session = None


def still(clip, at):
    """One graded frame of a clip (or a photo) as RGB, long side 1280."""
    seek = [] if clip["info"]["still"] else ["-ss", f"{at:.3f}"]
    r = subprocess.run(["ffmpeg", "-v", "error", *seek, "-i", str(clip["path"]), "-frames:v", "1",
                        "-vf", f"{BASE},scale=1280:1280:force_original_aspect_ratio=decrease",
                        "-f", "image2pipe", "-c:v", "png", "-"], capture_output=True)
    if r.returncode or not r.stdout:
        g.die(f"could not read a picture from {clip['path'].name}")
    return Image.open(io.BytesIO(r.stdout)).convert("RGB")


def cutout(ctx, clip, at):
    """The product of one frame on a transparent background, cropped tight. Cached next to the output,
    so a re-render with new words does not cut out again."""
    global _session
    p = clip["path"]
    out = (ctx.plan_dir / ctx.plan.get("output", f"output/{NAME}.mp4")).resolve()
    f = out.parent / f".work-{NAME}" / f"cut-{hashlib.sha1(f'{p}|{p.stat().st_mtime}|{at}'.encode()).hexdigest()[:12]}.png"
    if f.exists():
        return Image.open(f).convert("RGBA")
    import numpy as np
    from rembg import new_session, remove
    from scipy import ndimage
    if _session is None:
        print("[product-void] cutting out the product. The first time ever, this downloads the "
              "isnet-general-use model (about 170 MB).", flush=True)
        _session = new_session("isnet-general-use")  # named on purpose: rembg's default model is non-commercial
    cut = remove(still(clip, at), session=_session)
    a = np.array(cut.getchannel("A"))
    lab, n = ndimage.label(a > 127)
    if n == 0:
        g.die(f"no product found in {p.name}. Film it on a plain table or wall, or use \"cut\": false.")
    sizes = ndimage.sum(a > 127, lab, range(1, n + 1))
    keep = np.isin(lab, 1 + np.flatnonzero(sizes >= sizes.max() * 0.05))  # drop stray specks of background
    cut.putalpha(Image.fromarray(np.where(ndimage.binary_dilation(keep, iterations=3), a, 0).astype(np.uint8)))
    cut = cut.crop(cut.getbbox())
    cut.save(f)
    return cut


def accent(ctx, prod):
    """The line colour: look.accent, or the product's own strongest hue made readable on the void."""
    v = ctx.opt("accent", "auto")
    if v != "auto":
        if not isinstance(v, str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", v):
            g.die('look.accent must be "auto" or a colour like "#E8A06A"')
        return tuple(int(v[k:k + 2], 16) for k in (1, 3, 5)) + (255,)
    if prod is None:
        return NEUTRAL[ctx.void]
    import numpy as np
    hsv = np.array(prod.convert("RGB").convert("HSV")).reshape(-1, 3).astype(int)
    solid = np.array(prod.getchannel("A")).reshape(-1) > 200
    m = solid & (hsv[:, 1] > 60) & (hsv[:, 2] > 60)
    if m.sum() < 0.03 * max(1, solid.sum()):
        return NEUTRAL[ctx.void]   # a grey, black or white product: no colour to borrow
    hist = np.bincount(hsv[m, 0] // 8, weights=hsv[m, 1], minlength=32)
    h = (hist.argmax() * 8 + 4) / 255
    rgb = colorsys.hsv_to_rgb(h, 0.54, 0.91) if ctx.void == "black" else colorsys.hsv_to_rgb(h, 0.8, 0.6)
    return tuple(round(c * 255) for c in rgb) + (255,)


# ---------------------------------------------------------------- look

def setup(ctx):
    ctx.void = void(ctx)
    bg, ctx.ink = VOIDS[ctx.void]
    ctx.bg = Image.new("RGB", (W, H), bg)
    cuts = ctx.opt("cuts", "fade")
    if cuts not in ("fade", "cut"):
        g.die("look.cuts must be one of fade, cut")
    ctx.dip = cuts == "fade"
    ctx.scenes, first = {}, None
    bw, bh, cx, cy = BOX
    for i, c in enumerate(ctx.clips):
        if not cut_on(c):
            continue
        at = 0.0 if c["info"]["still"] else float(c.get("at", c["start"] + c["dur"] / 2))
        if not c["info"]["still"] and not 0 <= at < c["info"]["dur"]:
            g.die(f'clip {i + 1}: "at" must be between 0 and {c["info"]["dur"]:.1f}')
        prod = cutout(ctx, c, at)
        k = min(bw / prod.width, bh / prod.height)
        prod = prod.resize((round(prod.width * k), round(prod.height * k)), Image.LANCZOS)
        scene = ctx.bg.copy()
        scene.paste(prod, (cx - prod.width // 2, cy - prod.height // 2), prod)
        ctx.scenes[i] = scene
        first = first or prod
    ctx.accent = accent(ctx, first)


def SFX(ctx):
    # "only the hits that matter": a quiet whoosh as each product comes out of the void,
    # a soft low thud when the price line lands
    ev = [{"sound": "whoosh", "at": max(0, c - 0.1), "volume": 0.5} for c in ctx.cuts]
    ev += [{"sound": "thud", "at": x.get("start", 0), "volume": 0.5} for x in ctx.texts("line")]
    return ev


def frame(img, t, ctx):
    i, lt = ctx.clip_at(t)
    dur = ctx.clips[i]["dur"]
    z = 1 + PUSH * min(dur, 5) / 5 * g.ease_in_out(lt / dur)   # same speed for short and long shots
    base = ctx.scenes.get(i, img)
    fx, fy = (BOX[2], BOX[3]) if i in ctx.scenes else (W / 2, H / 2)
    pic = base.resize((W, H), Image.BICUBIC, box=(fx - fx / z, fy - fy / z, fx + (W - fx) / z, fy + (H - fy) / z))

    a = g.clamp(min(t / 0.5, (ctx.dur - t) / 0.6))           # fade from and to the void
    if ctx.dip:                                               # 0.5 s dip through the void between shots
        a = min([a] + [abs(t - c) / 0.25 for c in ctx.cuts[1:]])
    if a < 1:
        pic = Image.blend(ctx.bg, pic, g.clamp(a))
    canvas = pic.convert("RGBA")

    for item in ctx.active(t, "headline")[-1:]:
        s = ctx.cache(("headline", item["text"]), lambda: ink(
            item["text"], ctx.fit(item["text"], INTER, 840, 100, 40, {"opsz": 32, "wght": 700}, -0.02),
            ctx.ink, -0.02))
        rise = 24 * (1 - g.ease_out((t - item.get("start", 0)) / 0.6))
        g.paste(canvas, s, W / 2, HEAD_Y + rise, g.fade(t, item, 0.6, 0.4), anchor="mb")
    for item in ctx.active(t, "line")[-1:]:
        s = ctx.cache(("line", item["text"]), lambda: ink(
            item["text"], ctx.fit(item["text"], INTER, 840, 50, 28, {"opsz": 32, "wght": 400}), ctx.accent))
        rise = 24 * (1 - g.ease_out((t - item.get("start", 0)) / 0.6))
        g.paste(canvas, s, W / 2, LINE_Y + rise, g.fade(t, item, 0.6, 0.4), anchor="mt")
    return canvas


def ink(text, font, fill, tracking=0.0):
    """g.text_sprite one line at a time, stacked and centred."""
    rows = [g.text_sprite(ln, font, fill=fill, tracking=tracking) for ln in text.split("\n")]
    gap = int(font.size * 0.12)
    out = Image.new("RGBA", (max(r.width for r in rows), sum(r.height for r in rows) + gap * (len(rows) - 1)))
    y = 0
    for r in rows:
        out.alpha_composite(r, ((out.width - r.width) // 2, y))
        y += r.height + gap
    return out


if __name__ == "__main__":
    g.run(sys.modules[__name__])
