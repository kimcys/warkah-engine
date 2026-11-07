# Builder plan: the customer fills in details and picks options; no developer in the loop

Goal: like Warkah Kenang's Studio, a couple signs in, enters their details, chooses a theme, a colour option and their groom and bride
models, ticks the add-ons they want, sees the card live, then pays and publishes. Anything not ticked is not on the card.

This plan is based on what exists today (engine on branch `standardize-themes`, Kenang's Cloudflare API). Time estimates are rough.

## 1. What the engine already gives the builder

| Piece | Where | Builder uses it for |
|---|---|---|
| One data file per card, validated | `events/<slug>/event.json`, Zod schema in `src/content.config.ts` | The form's fields and validation |
| Feature switches with labels and needed data | `src/lib/features.ts` | The add-on / page tick-boxes |
| Themes with a standard contract | `src/themes/*`, `THEMES.md` | The theme chooser (4 themes today) |
| Colour options per theme (label, swatch) | `palettes` in each `theme.ts`, `?palette=` preview | The colour chips and instant recolour |
| Bride and groom library with tags | `models/library.json`, `couple.model` | The model picker |
| Card without add-ons is tiny | `events/minimal-demo` (0.4 MB, 4 pages) | Proof "not ticked = not included" |
| Build and deploy per card | `npm run build -- <slug>`, `scripts/deploy.mjs` | The publish step (MVP) |

And on the Kenang side (reuse, do not rebuild): email-code sign-in, weddings, packages and billing (CHIP and manual grant), admin
activation, R2 media storage, slug rules (`shared/slugs.ts`).

## 2. The customer journey (Malay UI, mobile first)

1. **Pasangan**: names, full names, whose name comes first, parents, who is inviting.
2. **Majlis**: date and time, venue name and address, Maps and Waze links (QR made automatically), programme (aturcara), contacts.
3. **Gaya**: theme (thumbnails), colour option (swatch chips), groom and bride model (grid, suggested by culture), music.
4. **Gambar**: cover/preview image, couple portraits, gallery.
5. **Tambahan**: tick-boxes from the feature catalogue. Ticking one reveals only its own fields: gifts → item editor; DuitNow → QR image and
   account name; ayat → verse; dress code → colours; Kenang → link to their Kenang event.
6. **Semak & terbit**: completeness check, preview in a phone frame, price summary, pay, publish. A shareable link at the end.

Always on the screen: a phone-frame preview that updates, a "what is missing" list, and Save draft.

## 3. Two ways to make the preview and the live card

**Track A, MVP (recommended first): keep cards static, build on a server.**
- Builder saves the draft as JSON (plus uploaded files) in the API.
- Palette and (small change) model switches update the preview instantly using `?palette=` and a `?groom=&bride=` swap (same idea, runtime).
- Text and photo edits: a build job writes `events/<slug>/` to a temp folder, runs `build` (about 10 to 20 s measured), and the preview iframe
  reloads. A "Updating preview..." spinner is acceptable for an MVP.
- Publish = the same job, then the finished static card is uploaded to R2 under `cards/<slug>/` and a small Worker serves
  `kad.warkah.com.my/<slug>` from it (cached at the edge). The card is built with `hosting.base = "/<slug>/"` (the engine already supports a
  base path, as the catalogue demos use). No Firebase Hosting site per card, and the existing Firebase deploy stays for current clients.
- Pros: no change to the card renderer, existing live cards keep working, fastest to ship. Cons: a build server to run and secure, publish takes under a minute.

**Track B, later: one app renders every card (like Kenang's one app, many couples).**
- Astro in server mode on Cloudflare Workers; the card reads its data from D1 by slug, theme files are shared (`/t/<theme>/...`), photos from R2.
- Preview and live card use the exact same code; edits show at once; no per-client build or hosting site.
- Cons: a real refactor (data loader, asset paths, caching), so do it once volume or build time hurts.

The first step in either track is the same (section 5, phase 0), so choosing A now does not block B.

## 4. Data and API (extend Kenang's Worker)

New table `cards` (per wedding): `id, wedding_id, slug, status (draft | paid | live), draft_json, live_json, theme, palette, version, created, updated`.
Files in R2 under `cards/<id>/` (customer images are shrunk to WebP in the browser before upload, the same way `models/` were prepared).

| Route | Purpose |
|---|---|
| `GET /api/catalogue` | Themes, palettes (label, swatch), models (tags), features (label, default, needs), field rules and limits |
| `POST/GET/PATCH /api/cards`, `GET /api/cards/:id` | Create and edit drafts (validated server-side with the same schema) |
| `POST /api/cards/:id/assets` | Upload a photo, QR image or song (type and size checked) |
| `POST /api/cards/:id/preview` | Track A: start a preview build, return its URL |
| `POST /api/cards/:id/publish` | After payment (or admin grant): build and deploy, set status `live` |
| `PATCH` after publish | Edit a live card: save a draft, then re-publish; guests' RSVPs and wishes are not touched |

Slug rules, rate limits and email-code sign-in come from the existing Worker. `store.mode` is `shared` for all builder cards.

## 5. Build order

**Phase 0: foundations in the engine (about 1 week).** Needed by every track.
- DONE: one `catalogue.json` generated from the code (`npm run catalogue` → `generated/catalogue.json`): themes with swatches and palettes, models, features,
  tiers, asset rules, the six form steps and the full JSON schema of `event.json`. Source files: `src/lib/event-schema.ts` (the schema, now separate from Astro),
  `features.ts`, `tiers.ts`, `asset-rules.ts`, `builder-steps.ts`, `theme-keys.ts`.
- DONE: friendly validation in Malay (`src/lib/validate.ts`): each problem names the field and says what to fix. It is plain TypeScript, so the API Worker can import it.
- TODO: a `sample.json` per theme so the preview is full of believable content before the customer types anything.
- TODO: theme thumbnails and one-line descriptions (screenshots are already generated into `design-export/`).
- TODO (0b): move the fixed Malay wording of the shared pages and panels into a string table, ready for English.
- TODO: system fields. The builder fills `hosting`, `store`, `meta` and `package` itself (`hosting.site` is still required today; make it optional for builder cards).

**Phase 1: the builder form and drafts (about 2 to 3 weeks).** Steps 1 to 6 above on top of Kenang's Studio patterns, with palette and
model instant preview and save-as-draft.

**Phase 2: preview and publish (Track A, about 1 to 2 weeks).** Build job, preview URL, deploy, status page, edit-after-publish.

**Phase 3: payment and tiers (about 1 week).** Reuse Kenang billing with the three tiers; the builder only offers the switches the chosen tier allows, and shows the price at step 6.
Manual WhatsApp activation first (as Kenang does), CHIP later. Prices stay placeholders until confirmed.

**Phase 4: Track B (only if needed).**

## 6. Decisions

**Confirmed**
- **Domain:** `kad.warkah.com.my`, one card per path: `kad.warkah.com.my/<slug>`. Slugs share the reserved-word list with Kenang (`shared/slugs.ts`).
- **Build server:** a DigitalOcean droplet later, with GitHub Actions for CI/CD. Split of work: the droplet runs the build queue (previews and publishes,
  so a preview does not wait for a cold CI runner); GitHub Actions runs checks on every push (`build:all`, validation tests) and deploys engine updates to the
  droplet, then re-publishes live cards that need an engine fix (a matrix over the live card list).
- **Language:** Malay now, Malay and English later. So fixed wording in the shared pages must move into a string table first (phase 0b below);
  Kenang's approach (Malay text is the key, English fills in) is the pattern to copy.
- **Models:** more are coming, and the customer can **change the colour of the outfit later** (see section 7).

**Prices: to be confirmed later.** Working numbers are in `src/lib/tiers.ts` as placeholders: **Asas RM39**, **Penuh RM79 (all features)**, **Reka Khas RM99
(a custom theme designed for the couple)**. A tier only decides which switches the customer may tick; the proposed Asas / Penuh split of switches is
marked "to confirm" in that file.

**Still open**
- Which switches belong to Asas (the split in `tiers.ts` is a proposal).
- How "Reka Khas" works in the builder (a request form handled by you, then a theme you add), and whether it is a separate theme folder per customer.
- Whether the old `package` field in `event.json` (`signature` | `custom`, unused by the code) is replaced by the tier ids.
- Slug choice rules for customers (auto from names with a number, or free text with a check).

## 7. Letting the customer recolour the models (later)

The library figures are white or ivory outfits, which makes recolouring feasible without redrawing:
- Each model gets a **garment mask** (a second WebP: white where the outfit is, transparent over skin, hair, shoes and veil edges).
- The card draws the figure and, on top, a colour layer clipped to the mask with `mix-blend-mode: multiply`, so folds and lace keep their shading and the
  garment takes the chosen colour. A customer picks from a short list of colours that suit the theme, or any colour.
- `couple.model.groomColor` / `brideColor` in `event.json` (optional hex), a `recolour` flag per model in `library.json` (a black suit would need a different
  method, so groom-3 is `none` at first), and the picker shows the result live because it is only CSS.
- Masks can be made semi-automatically (skin/hair/shoes removed by colour, the rest is cloth) and need a visual check per model. Worth a small
  prototype on two models before committing to it.

## 8. Risks and gaps to settle early

- **Customer-uploaded content:** photos and text are shown to guests. Need size and type limits, and a way to take a card down (admin).
- **Gaps in the cards themselves** (found while standardising): the shared pages' wording is fixed Malay; the Malay white-attire models for
  Royal Gold need a decision on whether they are only suggested or forced by theme; Glasshouse's painted pages cannot be recoloured.
- **Fonts:** every theme loads Google Fonts at view time. Fine for now; self-host if privacy or speed matters.
- **Missing data:** a ticked add-on with no data (gifts with no items) silently shows nothing. The builder must require the data when a box is ticked.
- **Abuse:** free drafts can be spammed; copy Kenang's rate limits and the "max 3 weddings per user" rule.
- **Editing after the event / expiry:** decide how long a card stays live and what happens to guest data afterwards.
