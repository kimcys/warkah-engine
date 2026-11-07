# Bride and groom models

The figure library every theme draws on the groom and bride pages. A client picks one groom and one bride in `event.json`:

```json
"couple": { "groom": {...}, "bride": {...}, "model": { "groom": "groom-1", "bride": "bride-3" } }
```

Leave `model` out and the theme's default applies (Lover and Enchanted Garden), or the theme's own painted couple (Royal Gold,
Glasshouse). A wrong id stops the build and lists the valid ones.

| id | who | culture | outfit |
|---|---|---|---|
| groom-1 | groom | malay | white baju melayu, white samping, songkok |
| groom-2 | groom | malay | songket baju melayu, samping, tanjak |
| groom-3 | groom | modern | black suit |
| bride-1 | bride | modern | tulle gown, hijab, long veil |
| bride-2 | bride | malay | songket kebaya, traditional crown |
| bride-3 | bride | malay | white lace kebaya, ivory hijab |
| bride-4 | bride | modern | lace mermaid gown, long veil |
| bride-5 | bride | modern | lace gown, lace-edged veil |
| bride-6 | bride | modern | ball gown, tiara, veil |

`library.json` is the source of truth (id, label, who, culture, hijab, description, file).

## Adding a model
1. Faceless, standing, full length, transparent PNG, about 1024 x 1536, centred, feet near the bottom edge.
2. Save as WebP (width 800, quality about 86, under about 220 KB) in this folder.
3. Add an entry to `library.json`. The schema in `src/content.config.ts` reads the ids from it.

## How a theme uses them (`src/themes/define.ts`)
- `defaultModels: { groom, bride }`: every card shows a figure; the scene behind is one of the theme's normal scenes.
- `modelScenes: { groom, bride }`: for a theme whose own groom/bride scene has the couple painted in. When a model is chosen the page swaps
  to these figure-free scenes; with no model the painted scene is kept.
- The shared page `src/components/sections/Mempelai.astro` draws the figure and the name panel; `public/core/models.css` positions them.
