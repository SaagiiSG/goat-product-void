---
name: goat-product-void
description: Product Void · Хоосон дэвсгэр. Cuts the product out of the user's photo or clip and shows it alone in pure black or white space, Apple-style, with a slow push-in, one clean Mongolian headline and a price line in the product's own colour. Renders a 1080x1920 MP4 for Reels/TikTok. Best for ecommerce (cosmetics, perfume, accessories, watches), nail art close-ups, car details and retail products. Use whenever the user wants a clean, premium, minimal, Apple-like or "хоосон дэвсгэр" product video, or types /goat-product-void, /бараа, or says "барааг минь хоосон дэвсгэр дээр тавиад зар хий", "Apple шиг бүтээгдэхүүний видео хий", "make a clean product video", even if they don't name the skill.
---

# Product Void · Хоосон дэвсгэр

One product alone in pure black or pure white space. All the colour lives on the product; most of the screen stays empty. The product drifts slowly closer (a 6% push-in), one headline rises in above it, and one line (the price) appears in a colour taken from the product. Shots dip through the void between products. It is the only GOAT look where most of the screen is empty.

**Good for:** ecommerce (cosmetics, perfume, phone accessories, watches), nail art close-ups, car details (wheel, badge, stitching), retail products.
**Not for:** salons with busy interiors, talking heads, anything that can't be separated from its background. If the user's footage is one of these, say so and suggest another GOAT look.

Talk to the user in the language they write in (usually Mongolian). Keep messages short and plain; many users are not technical. `SKILL_DIR` means this skill's base directory (shown when the skill loads). Run commands from the user's project folder with absolute paths into `SKILL_DIR`.

## 1. Setup check (first time on a machine)

Run `ffmpeg -version` and `uv --version`. If either is missing, show the install command and ask before installing (it is their computer):
- Mac: `brew install ffmpeg uv`
- Windows: `winget install Gyan.FFmpeg` and `winget install astral-sh.uv`, then close and reopen the terminal.

The first render installs the Python packages (Pillow, numpy, scipy, rembg) and **downloads the cut-out model once, about 170 MB**. Tell the user the first run takes a few minutes; after that it is fast. It needs Python 3.11 or 3.12, which uv fetches by itself.

## 2. Collect the clips and words

Make `raw/` and `output/` in the current folder. Ask for:
1. **One photo or clip per product.** Best: the product on a plain table or wall, one light, phone on a tripod or held still. For a clip, the product is cut out of one frame (pick it with `at`), so the product holds still in the video and only drifts closer. If the user filmed the product on black cloth or a white paper sweep and wants the real movement (turning it by hand), use that clip with `"cut": false`.
2. **The words:** one headline per product (2–4 words, e.g. "Шинэ үнэртэн") and one line (the price, or "name · price"). End with a headline like "Цаг захиалаарай" and the phone number as its line. Never invent a price or phone number. Ask.

Then run: `uv run SKILL_DIR/scripts/goatcut.py probe raw/*`
It prints each file's size, length, whether it has sound, and whether it is HDR.

## 3. Write plan.json

Write `plan.json` in the project folder. Paths are relative to it.

```json
{
  "output": "output/product-void.mp4",
  "clips": [
    {"src": "raw/perfume.jpg", "dur": 4.5},
    {"src": "raw/nails.mp4", "at": 1.5, "in": 0, "out": 3},
    {"src": "raw/turning-on-black.mp4", "cut": false}
  ],
  "texts": [
    {"role": "headline", "text": "Шинэ үнэртэн", "start": 0.4, "end": 4.3},
    {"role": "line",     "text": "89 000₮",      "start": 1.2, "end": 4.3},
    {"role": "headline", "text": "Цаг захиалаарай", "start": 7.8},
    {"role": "line",     "text": "9911-2233",       "start": 8.4}
  ],
  "look": {"void": "black", "accent": "auto", "cuts": "fade"}
}
```

**clips:** one product per clip. A photo needs `dur`; a video's length is `out - in`. `at` (seconds into the video) picks the frame the product is cut out of (default: the middle). `"cut": false` uses the footage as filmed and only darkens (or brightens) the cloth into pure void; use it only when the product was really filmed on a black or white background. Each product should hold 3–5 s: slow is the point.
**texts:**
- `headline`: Inter bold, white on black (near-black on white), rises in above the product. 2–4 words.
- `line`: smaller, in the product's colour, just under the headline. Prices and phone numbers go here: it is inside the area no app buttons cover.
Only one of each shows at a time. Long words shrink to fit.
**look** options:
- `void`: `black` (default) or `white` (off-white text becomes near-black).
- `accent`: `auto` (default: the product's strongest colour, or grey for a black/white/grey product) or a colour like `"#E8A06A"`.
- `cuts`: `fade` (default: a quick dip through the void between products) or `cut`.

**Auto sound effects:** a quiet whoosh as each product comes out of the void, and a soft low thud when each price line lands. Nothing else: this look is quiet on purpose.

Before rendering, tell the user the plan in plain words (products in order, the words, black or white) and ask "OK?". This is the only approval needed.

<!-- audio: this section is copied from core/skill-audio.md by build.py; edit it there -->
## Sound effects, voice-over and music

**Sound effects are on by default.** The look adds its own (see "Auto sound effects" above). They are made in code, so there's nothing to license, and they sit quietly under the voice.
- Turn them off: `"sfx": false`. Make them quieter or louder: `"sfx": {"volume": 0.6}`.
- Add one: `"sfx": {"add": [{"sound": "ding", "at": 4.2}]}`. Sounds: whoosh, swish, pop, click, type, shutter, boom, thud, hit, riser, ding, notify, shimmer, paper, tape, marker, projector, tick. `type`, `marker`, `projector` and `riser` also take `"dur"` in seconds; a riser should end on the moment it builds to.
- Let the user hear one render before adding more. Too many sounds feel cheap.

**Voice-over.** If the user wants to talk over the video, ask them to record it on their phone (a voice memo is fine: m4a, mp3 or wav) and copy it into `raw/`. Then add `"voiceover": {"src": "raw/vo.m4a", "at": 0.5}` (`at` = when it starts; optional `"volume"`). While the voice plays, the clips' own sound and the music dip automatically. Run `goatcut.py probe raw/vo.m4a` to get its `speech` spans and time the words on screen to them. The clips must add up to at least the voice-over's length (the render warns if not). Recording tips for the user: a small quiet room (a parked car or a wardrobe works), phone about 20 cm from the mouth, read the script out loud once before recording.

**Music.** `"music": {"src": "raw/song.mp3", "volume": 0.25}`. Only use music the user has the rights to. Music added inside the Instagram/TikTok app is the safe choice, so suggest that first.
<!-- /audio -->

## 4. Render and check

`uv run SKILL_DIR/scripts/render.py plan.json`

Cut-outs are cached next to the output, so a re-render with new words doesn't cut out again. Then look at three frames, one per product, before saying it is done:
`ffmpeg -y -loglevel error -ss 2 -i output/product-void.mp4 -frames:v 1 output/check-1.jpg` (and two more times). Read them. Check the product is cleanly cut out (no table edge or hand left over, nothing missing), and the words read well. If a cut-out is messy, try a different `at`, or ask for a photo on a plainer background. If the render says "no product found", the background is too busy.

If a render fails twice, stop and explain the error in plain words. Don't loop.

## 5. Hand over

Tell the user where the file is (`output/product-void.mp4`) and that it is ready to post. Music can be added in the Instagram/TikTok app.

## Rules

- Prices and phone numbers go only in `line`.
- One headline at a time, 2–4 words. Most of the screen stays empty; don't add more text.
- Use only the font bundled in `SKILL_DIR/fonts` (Inter, it has Ө ө Ү ү). Don't swap in other fonts.
- The cut-out model is rembg `isnet-general-use`, named on purpose: rembg's default model is non-commercial. Don't change it.
- The output is 1080x1920, 30 fps, H.264, sound at -14 LUFS (Instagram/TikTok level).
