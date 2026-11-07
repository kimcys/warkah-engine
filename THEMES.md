# Theme standard

Every theme in `src/themes/<name>/` follows one contract so cards behave the same whichever theme a client picks.

## Files

| File | Rule |
|---|---|
| `theme.ts` | `export default defineTheme("<name>", {...})` (see `src/themes/define.ts` for every key and default) |
| `Opening.astro` | must contain `<button id="openInvite">` (the build checks) |
| `Backdrop.astro` | scene layers (layout `pages`) + `.fairy-lights` + `.petal-field` |
| `sections/*.astro` | optional: pages the theme draws itself, registered in `components` |
| `public/` | `style.css`, `favicon.svg`, backgrounds (served at `/theme/`) |

## Standard pages (`src/lib/sections.ts`)

`sections` MUST list all 17 ids in `REQUIRED_SECTIONS` (`src/lib/sections.ts`): hero, invitation, mempelaiGroom, mempelaiBride,
details, countdown, programme, portraits, gallery, doa, ayat, venueSign, dressCode, rsvp, wishes, gifts, thanks.
Missing or duplicated ids stop the build.

Each standard page has a shared fallback in `src/components/sections/`, so a theme only needs its own
component when it wants a different design. Features switch pages off per client (`sectionEnabled`).

## One layout, one bottom bar, one gift flow (same in every theme)

- **Layout.** All themes are `layout: "pages"`: one page per screen, snapping, a panel floating over scenes that cross-fade.
  A theme with a single artwork (Lover) still defines several scenes by tinting/panning it.
- **Pages.** Standard list is in `src/lib/sections.ts`. Switched on by `features` (ayat, venueSign, gifts/duitnow, mempelai, ...) or
  by data (`dressCode`). Each has a shared page in `src/components/sections/`; a theme only draws its own for a different design.
- **Bottom bar** (`BottomNav.astro`), at most 5 buttons: `[Hadiah] · Lokasi · [Muzik] · [RSVP] · Hubungi`.
  Hadiah appears only when gifts or DuitNow is on. Kenangan only takes a spare slot. Kalendar is in the Lokasi sheet and on Details.
- **Hadiah.** Only gifts or only DuitNow: that one, no tab bar. Both: a tab bar (`Senarai Hadiah | DuitNow`) in the sheet and on the page
  (`data-tabs` / `data-tab` / `data-tab-pane`, handled in `card.js`).

## Features (what a client can switch on or off)

`event.json` `"features"` holds the switches; the catalogue is `src/lib/features.ts` (label, default, what data it needs), and the schema,
`sectionEnabled()` and the future builder all read from it. To add a switch, add one line there.

- **Pages** (default on): mempelai, countdown, programme, portraits, gallery, dressCode, doa, rsvp, wishes, music.
- **Add-ons** (default off): ayat, venueSign, gifts, duitnow, kenang, guestName.
- **Always there** (no switch): hero, invitation, details, thanks, and the Lokasi / Hubungi buttons.
- A switched-off page is not in the card; with music off there is no player; with RSVP, wishes and gifts all off the guestbook code (Firebase) never
  starts (`needsStore`); with mempelai off no model files ship. `events/minimal-demo` has everything off (about 0.4 MB, 4 pages, 2 buttons).
- A switch also needs its data: gallery needs photos, gifts needs items, duitnow needs an image, dressCode needs its block, music needs a song.
  Without the data the page is simply not shown. Wishes are written through the RSVP form, so wishes without RSVP only shows the couple's own `defaultWishes`.

## Groom and bride models

The two person pages use the shared figure library in `models/` (see `models/README.md`). A client chooses with `couple.model`.
A theme sets `defaultModels` (a figure on every card) or `modelScenes` (figure-free scenes to use when a model is chosen, for
themes with a painted couple). Nothing else is needed: the shared page and `public/core/models.css` do the rest.

## Colour palettes

A client picks a colour option with `"palette": "<id>"` in `event.json` (default `classic` = the theme as designed). A theme lists its
options in `palettes` in `theme.ts` (see `Palette` in `src/themes/define.ts`): a label, a 3-colour swatch for the picker, the CSS variables
to override (`vars`), and optionally `tint` (hue / saturate / brightness applied to the scene artwork, and the opening image),
`themeColor` and `petals`.

- Only variables the theme's CSS already uses can be recoloured (`:root` at the top of its `style.css`). Colours written literally in the CSS stay.
- Use `tint` only when the artwork is abstract or has no people painted in (Lover, Royal Gold). Glasshouse and Enchanted Garden are colour-only,
  because tinting turns painted skin and foliage unnatural.
- Every palette's CSS is in the page, keyed by `html[data-palette="<id>"]`, so `?palette=<id>` in the link previews any option without a rebuild.
- A palette id the theme does not offer stops the build and lists the valid ones.

| Theme | Palettes (besides classic) | Tint |
|---|---|---|
| Royal Gold | rose-gold, ivory, navy | yes |
| Lover | lilac, peach, mint | yes |
| Glasshouse | blush, dusty-blue, champagne | no |
| Enchanted Garden | lavender, dusty-rose, ocean | no |

## Keys

- `layout`: `"pages"` (snapping pages with scenes) or `"scroll"` (one continuous scroll). Body class is derived.
- `scroll`: `"pages" | "free"`, only for themes that offer both.
- `client`: `fairyLights`, `petals`, `openingDelay`, `wishesPerPage`, `scenes` (defaults in `define.ts`; `scenes` follows `layout`).

## Adding a theme

1. Copy `royal-gold/`, rename, restyle.
2. Register it in `src/themes/index.ts` and add the name to the `theme` enum in `src/content.config.ts`.
3. `npm run build -- <a client using it>`: any contract problem is reported by name.
4. Style every standard page, including countdown and wishes.
