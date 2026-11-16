---
name: goat-product-void
description: Product Void · Хоосон дэвсгэр. Shows each of the user's product photos alone in pure black or white space, Apple-style: a floating cut-out when the photo's background is removed, a clean rounded card when it isn't, lit with a soft glow, a passing sheen and a floor reflection, drifting slowly closer, with one clean Mongolian headline and a price line in the product's own colour, and a dip through the void between products. Built on HyperFrames. Renders a 1080x1920 MP4 for Reels/TikTok. Best for ecommerce (cosmetics, perfume, accessories, watches), nail art close-ups, car details and retail products. Use whenever the user wants a clean, premium, minimal, Apple-like or "хоосон дэвсгэр" product video, or types /goat-product-void, /бараа, or says "барааг минь хоосон дэвсгэр дээр тавиад зар хий", "Apple шиг бүтээгдэхүүний видео хий", "make a clean product video", even if they don't name the skill.
---

# Product Void · Хоосон дэвсгэр

One product at a time, alone in pure black or pure white space. All the colour lives on the product; most of the screen stays empty. Each product comes up out of the void and settles, a soft light glows behind it in its own colour, a sheen of light crosses it once, it stands on a faint reflection, and it drifts slowly closer (a 6% push). One headline rises in above it and one line (the price or offer) sits under it in a colour taken from the product. Between products the screen dips through the void for half a second. It is the only GOAT look where most of the screen is empty.

**Good for:** ecommerce (cosmetics, perfume, phone accessories, watches, bags), nail art close-ups, car details (wheel, badge, stitching), retail products.
**Not for:** salons with busy interiors, talking heads, anything that is about the place or the person rather than one object. There is no footage: each product is a still photo. If the user's material is like that, say so and suggest another GOAT look.

Talk to the user in the language they write in (usually Mongolian). Keep messages short and plain; many users are not technical. `SKILL_DIR` means this skill's base directory (shown when the skill loads). Run commands from the user's project folder with absolute paths into `SKILL_DIR`. `goat` below means `node SKILL_DIR/scripts/goat.mjs`.

## 1. Setup check (first time on a machine)

**Every new video, first:** run `claude plugin marketplace update goat-product-void`, then `claude plugin update goat-product-void@goat-product-void`. If it installs a new version, tell the user a new version was installed and ask them to type `/reload-plugins` before you go on. If either command fails (offline, or installed from a zip), carry on and don't mention it.

Run `node --version` (needs 22 or newer) and `ffmpeg -version`. If either is missing, show the install command and ask before installing (it is their computer):
- Mac: `brew install node ffmpeg`
- Windows: `winget install OpenJS.NodeJS.LTS` and `winget install Gyan.FFmpeg`, then close and reopen the terminal.

This look has no captions and no cut-out model, so it needs no speech model and downloads no AI model. The first render downloads, once, a private copy of Chrome that draws the frames. Tell the user the first run takes a while; after that it starts at once. Nothing is uploaded: everything runs on their computer, with no account.

**Long steps:** the first `render` (the Chrome download) can run longer than a normal command timeout. Run it in the background, or with a 600000 ms timeout, and wait for it to end. Never stop it and start it again.

**Windows has not been tested yet.** If a step fails there, show the error to the user in plain words.

## 2. Collect the photos and words

Make `raw/` and `output/` in the current folder. Ask for:
1. **One photo per product.** Just ask them to put in the photo. A photo with its background removed floats in the void as a cut-out, following the product's own shape; any other photo shows as a clean rounded card (the whole photo, lit the same way). The cut-out looks best, so tell them how to remove the background, but never require it:
   - iPhone: open the photo, touch and hold the product until it glows (Copy Subject), then tap **Share…** → **AirDrop** to send it to this computer as a PNG; or tap **Copy**, paste it into a new note in **Notes** and share it from there (AirDrop or **Save to Files**). Put the PNG in `raw/`. A picture pasted straight into this chat is not saved as a file, so it can't be used.
   - Samsung: touch and hold the product, then **Save as image**. Google Photos (Android): touch and hold, then copy or save it.
   - Mac: in Finder, right-click the photo → **Quick Actions** → **Remove Background**.
   - Windows: open the photo in **Paint** → **Remove background**, then save it as PNG.
   Best photo: the product filling most of the frame, one soft light, nothing else touching it. If they send a video, pull its best still yourself (`ffmpeg -y -loglevel error -ss 2.0 -i raw/clip.mov -frames:v 1 raw/clip-still.png`, at the moment they name) and use that photo: a product is always a photo. If `goat probe` says the video is `"hdr": true` (an iPhone's default), a still pulled from it looks grey and washed out: ask for a photo of the product instead, or a screenshot of the paused video taken on the phone (the phone tones it down).
2. **The words:** one headline per product (2–4 words that say what the photo shows, e.g. "Үнэртэн"; "new", "best" or a number only if the user says so), and, if they give one, one line under it: the price or offer exactly as they write it. A closing headline with how to order is optional. Every word comes from the user or from what the photos show. Never invent a price, phone number or date. Ask. No emoji or symbols such as ✦ ♥ ✓: the font can't draw them (render refuses them).

Then run `goat probe raw/*`. It prints each file's size and whether it is a photo. To see before rendering which photos float as cut-outs, run `ffprobe -v error -show_entries stream=pix_fmt -of csv=p=0 raw/perfume.png` for each: `rgba`, `yuva420p` or another format with an `a` for alpha means a cut-out, unless it is opaque everywhere (a screenshot saved as PNG often is: then it's a card); anything else is a card. Render says it again for each product.

## 3. Prepare

Write `plan.json` in the project folder (paths are relative to it):

```json
{
  "output": "output/product-void.mp4",
  "products": [
    {"src": "raw/perfume.png", "start": 0, "end": 4.5},
    {"src": "raw/bag.jpg", "start": 4.5, "end": 9}
  ],
  "texts": [
    {"role": "headline", "text": "Үнэртэн", "start": 0, "end": 4.5},
    {"role": "headline", "text": "Савхин цүнх", "start": 4.9}
  ],
  "look": {"void": "black", "accent": "auto"}
}
```

**products** show one at a time, in order. Each is a photo with a `start` and an `end` in seconds. The first starts at `0` (the first frame is the Reels thumbnail; a plan whose first product starts later is refused). They may not overlap; a gap between two shows the empty void. Each needs **2 s at least** (refused otherwise); 3–5 s is best: slow is the point. There are no `clips` in this look (a plan with `clips` is refused).

**The video's length** is the last product's `end`, or a word's `end` after it if you close on words alone in the void (for example how to order, in the user's words).

Then run these in order. Each one says what to run first if a step is missing.
1. `goat prep plan.json`: makes `.work-product-void/main.mp4`, an empty video as long as the products and words (the page draws the void, the products and the words on top). **Run it again whenever the last `end` changes the video's length** (render refuses an empty video of the wrong length). Changing photos, words or colours needs no new prep: render makes each product's picture fresh every time.
2. `goat cut plan.json`: this look never cuts pauses; the step only readies the video and takes a second.

## 4. Write the words

**texts** (only one of each role shows at a time: a later one ends the one before). A longer row, too many rows, or an empty row (a stray `\n`) is refused with a message saying what to change.
- `headline`: Inter Bold, up to 100 px, white on black (near-black on white). It rises 24 px into place above the product, its last row ending on the same line every time. **At most 2 rows of 15 characters** (spaces count; split rows with `\n`). A long row shrinks to fit the 840 px safe width: "Хумсны будалт" and "Цаг захиалаарай" stay at the full 100 px; 15 of the widest letters (Ю Ж Щ) go down to 56 px. № is wider still and can run past.
- `line`: Inter Regular, up to 56 px, in the product's own colour, just under the headline. **One row of at most 26 characters**; a long one shrinks, to 32 px at the least. Prices, phone numbers and offers go here, exactly as the user wrote them: it is inside the area no app buttons cover. Example shape: `{"role": "line", "text": "…", "start": 1.2, "end": 4.5}`, where "…" is the price or offer the user gave.

**Timing:**
- Each word needs **1.2 s on screen** at least (a shorter one is refused): it rises in over 0.6 s and fades over 0.4 s.
- **The thumbnail:** start the first product's headline at `0`: it is then already there on frame 0, sharp, with no animation.
- Give a product's words the product's own times: the headline from its `start` (or 0.4 s after it), the line 0.8 s after the headline (as the preview staggers them), both ending at its `end`. Words can also run across a product change; they stay while the products dip.
- The last product, and words that run to the end of the video, fade into the void over the last 0.6 s.

**look** options:
- `void`: `black` (default) or `white`.
- `accent`: `auto` (default: the line takes its product's strongest colour, made a little lighter on black or darker on white until it reads at 4.5:1; a black, white or grey product gives grey) or the user's brand colour, like `"#B4442C"`. A colour too faint to read on the void (under 3:1) is refused with a message: pick another, or leave it `auto`.

The glow behind each product (on black) always takes that product's own colour; on white the product casts a soft shadow instead.

**Auto sound effects** (soft, about a third of the old version's levels; raise them with `"sfx": {"volume": 1.5}`): a quiet whoosh as each product after the first comes out of the void, and a soft low thud as each line lands. Nothing for what is already up on frame 0, and never two within 0.5 s (the earlier one plays). This look is quiet on purpose.

Before rendering, tell the user the plan in plain words (the products in order, black or white, the words and when they come) and ask "OK?". This is the only approval needed.

<!-- audio: this section is copied from core/skill-audio-node.md by build.py; edit it there -->
## Sound effects, voice-over and music

**Sound effects are on by default.** The look adds its own (see "Auto sound effects" above). They are made in code, so there's nothing to license, and they sit quietly under the voice.
- Turn them off: `"sfx": false`. Make them quieter or louder: `"sfx": {"volume": 0.6}`.
- Add one: `"sfx": {"add": [{"sound": "ding", "at": 4.2}]}`. Sounds: whoosh, swish, pop, click, type, shutter, boom, thud, hit, riser, ding, notify, shimmer, paper, tape, marker, projector, tick. `type`, `marker`, `projector` and `riser` also take `"dur"` in seconds; a riser should end on the moment it builds to.
- Let the user hear one render before adding more. Too many sounds feel cheap.

**Voice-over.** If the user wants to talk over the video, ask them to record it on their phone (a voice memo is fine: m4a, mp3 or wav) and copy it into `raw/`. Then add `"voiceover": {"src": "raw/vo.m4a", "at": 0.5}` (`at` = when it starts; optional `"volume"`). While the voice plays, the clips' own sound and the music dip automatically. Run `node SKILL_DIR/scripts/goat.mjs probe raw/vo.m4a` to get its `speech` spans and time the words on screen to them. The clips must add up to at least the voice-over's length (the render warns if not). Recording tips for the user: a small quiet room (a parked car or a wardrobe works), phone about 20 cm from the mouth, read the script out loud once before recording.

**Music.** `"music": {"src": "raw/song.mp3", "volume": 0.25}`. Only use music the user has the rights to. Music added inside the Instagram/TikTok app is the safe choice, so suggest that first.
<!-- /audio -->

## 5. Render and check

`goat render plan.json`

It makes each product's picture (and says, for each, whether it floats as a cut-out or shows as a card), draws the void, the products and the words, mixes the sound and writes the MP4 plus a contact sheet (one frame per second) at `.work-product-void/sheet.jpg`. On our test Mac a 9–10 s video of two products took 8–10 s to render (prep and cut under a second each). Longer videos take longer. Run the next render only after the last one ends.

Read the contact sheet, the first frame, and full-size frames: 0.4 s after each product starts (it is out of the void by then, still settling), and 0.35 s before each product ends (the dip into the void takes its last 0.25 s); for the last product 0.7 s before the end (it fades with the video over the last 0.6 s). Never pull one inside a dip. For the example plan:
`ffmpeg -y -loglevel error -i output/product-void.mp4 -frames:v 1 output/check-0.jpg` (the thumbnail)
`ffmpeg -y -loglevel error -ss 4.15 -i output/product-void.mp4 -frames:v 1 output/check-4.15.jpg` (the first product, settled)
`ffmpeg -y -loglevel error -ss 6.0 -i output/product-void.mp4 -frames:v 1 output/check-6.0.jpg` (the second product with its headline).
Check that:
- the first frame (the thumbnail) shows the first product and its headline;
- every word is spelled right (Ө ө Ү ү!) and whole, and the line reads on the void;
- a cut-out has no leftover background (a table edge, a hand, a white halo) and nothing missing. If it does, ask for the photo again with the background removed more carefully, or use the plain photo (it becomes a clean card).

If a render fails twice, stop and explain the error in plain words. Don't loop.

## 6. Hand over

Tell the user where the file is (`output/product-void.mp4`) and that it is ready to post. Music can be added in the Instagram/TikTok app.

## Rules

- Every word and graphic on screen comes from what this video says or shows, or from what the user gave you. The examples in this file are only examples: never put them in a video. If the user hasn't given the words, ask.
- Prices, phone numbers and offers go only in `line`, exactly as the user wrote them.
- One headline at a time, 2–4 words. Most of the screen stays empty; don't add more text.
- Use only the font bundled in `SKILL_DIR/fonts` (Inter: it has Ө ө Ү ү and ₮). Don't swap in other fonts.
- Never invent a price, phone number or date; ask.
- The output is 1080x1920, 30 fps, H.264. This look has no footage, so with no music or voice-over the effects play alone and the reel is much quieter than Instagram/TikTok's -14 LUFS (our two-product test: -34 LUFS); add music in the app. A voice-over or music is brought to -14 LUFS with the effects on top.
