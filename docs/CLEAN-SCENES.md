# Clean scenes: putting the customer's models where the painted couple stands

Two themes, **Emas Diraja** (`royal-gold`) and **Rumah Kaca** (`glasshouse`), have the couple painted into some of their scene pictures. Taman Permai and Kasih do not.
To show the customer's chosen models in those places (same spot, same height, same feet line), each of those scenes needs a **clean plate**: the same picture with the people removed.
Software cannot rebuild what is behind them credibly (the sofa, curtains, floor), so the clean plates have to be made with an image-editing AI or by an artist.

The engine is ready for them. Nothing changes until a clean plate exists, so the themes look exactly as before in the meantime.

## How it works once a plate is added

1. Put the clean picture next to the painted one, named `<scene>-clean.webp`, **exactly the same pixel size and crop**:
   `src/themes/<theme>/public/bg/<scene>-clean.webp`
2. `src/themes/<theme>/scene-couples.json` already holds where the painted pair stands in each scene (measured from the painted pictures): `cx` (middle, across), `feet` (feet line, down), `h` (height of the figure), as fractions of the picture.
3. When a card shows chosen models, the build (`scripts/compose-scenes.mjs`) lays the models on the clean plate at those places, in the customer's outfit colours, with a soft shadow, and writes the result over `bg/<scene>.webp` for that card only. The clean plate itself never ships.
4. To check where the models will stand before any plate exists: `node scripts/compose-scenes.mjs --standin royal-gold groom-2 bride-2 /tmp/check` lays them on the **painted** scenes (the painted figures still show behind them).
5. Once the plates are in, switch on the default pair for painted themes in the builder (see "After the plates" below).

## What to generate

Use an image editor that can remove objects and fill the background: Photoshop Generative Fill, Gemini or ChatGPT image editing, Firefly, or similar. Give it the painted picture
(`src/themes/<theme>/public/bg/<scene>.webp`), and optionally the matching mask in `docs/clean-scene-masks/` (white = remove). The masks for the stage scenes are accurate;
the others are rough ellipses around where the pair stands. Check every result at full size: nothing but the people may change.

### The prompt (use for every scene, filling in the line for that scene)

> Edit this image. Remove the two people completely (the groom and the bride), including their shadows and the bouquet. Fill the space where they stood with what would naturally be behind and
> around them: **[SCENE LINE]**. Keep everything else exactly identical: the same composition and crop, colours, lighting, flat illustrated art style, soft haze areas, and the same
> pixel size (**[SIZE]**). Do not add any person, text, logo or new object. Do not redraw or move anything outside the removed area. Output the full picture at the same size.

If the tool takes a mask, add: *"Only change the white area of the mask."*

### Scenes (the painted ones the themes use)

| Theme | File (`public/bg/`) | Size | Where the people are | [SCENE LINE] |
|---|---|---|---|---|
| royal-gold | `stage.webp` | 1144 x 2560 | Small, standing together on the dais, lower middle (about 42% to 58% across, feet at 88% down) | the white tufted sofa continues behind them across the dais, the cream backdrop with gold scroll ornament and the maroon curtains with gold fringe behind that, and the smooth golden floor in front |
| royal-gold | `aisle.webp` | 1440 x 2560 | Large at the top, cut off by the top edge (heads out of the picture), to the left of centre | the white tufted sofas on both sides continue behind them, the cream backdrop with gold ornament and the maroon curtains above, and the golden floor that fades into a soft haze below |
| glasshouse | `stage.webp` | 576 x 1024 | Large, from the head down to the bottom edge, left of centre (head tops at about 56% down) | the white sofa on a white platform, green foliage and white flowers behind, and the white aisle with silver edges running to the bottom of the picture |
| glasshouse | `hall.webp` | 576 x 1024 | Small, standing on the white aisle in the middle (about 44% to 54% across, feet at 60% down) | the white aisle floor with silver edges, the green flower arch and the white sofa behind, and the dining tables and flowers at the sides |
| glasshouse | `aisle.webp` | 576 x 1024 | Small, standing on the white aisle, a little lower than in `hall` (feet at 67% down) | the white aisle floor with silver edges and the green flower arch behind |

### Scenes that only need a tiny distant man removed (no model goes there)

In these four Rumah Kaca scenes a small painted groom stands far away behind the glass door or at the end of the aisle. Remove only him and fill with the glass door, flowers and floor behind him.
They use the file name `<scene>-clean.webp` too and are copied in as they are.

| File | Size | Where |
|---|---|---|
| `court.webp` | 576 x 1024 | behind the glass doors, middle |
| `opening.webp` | 576 x 1024 | far inside the arch, middle |
| `garden.webp` | 576 x 1024 | far end of the lawn, middle |
| `gate.webp` | 576 x 1024 | far end behind the flower arch, middle |

## After the plates

Until now a card on these themes shows the painted couple unless the customer chose models. Once the plates are in, every Warkah Kad card on them should show models, chosen or a default pair
(Emas Diraja: `groom-2` and `bride-2`, the songket pair; Rumah Kaca: `groom-3` and `bride-4`). That is a small change (a default applied to the draft before the sample is merged; it was written
once and reverted, see git history: "Builder cards never show the painted couple"). Ask for it when the plates are ready.

## Notes

- Check the anchors against the real clean plates. They were measured from the painted pictures, within a few percent; each anchor is one line in `scene-couples.json` and can be nudged.
- Models are standing, facing front, hands together or at their sides, like the painted figures. The painted pair holds hands in some Rumah Kaca scenes; the models stand side by side.
- Where a scene cuts the figure off (the Rumah Kaca stage at the bottom, the Emas Diraja aisle at the top) the model is cut off in the same way.
