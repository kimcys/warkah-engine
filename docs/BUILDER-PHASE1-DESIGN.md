# Builder, Phase 1: the form and the drafts (design)

Status: proposal for review. Builds on `docs/BUILDER-PLAN.md` (Phase 0 is done: catalogue, form steps, Malay validation, samples, thumbnails, system fields, slugs).
Rough estimates are marked "(est.)".

## 1. What Phase 1 delivers

A customer signs in, starts a card, fills six steps on their phone, picks a theme, a colour and their models, ticks add-ons, uploads photos, and sees a live phone preview of
their *design choices*. Their draft is saved as they type and they can come back to it. The card is **not yet published** (no build, no payment): that is Phase 2 and 3.

In scope:
- sign in (existing email-code login), list and create cards, one editable draft per card
- the six steps, rendered from `src/lib/builder-steps.ts`, with autosave and optimistic locking
- uploads: photos, cover, QR, song (type, size and dimensions checked on the server)
- live validation in Malay, a "what is missing" list, tier locks on features (Asas / Penuh / Reka Khas)
- instant preview of theme, colour and models (prebuilt sample cards, switched with query parameters)

Out of scope (later phases): building a card from the draft, the publish step and `kad.warkah.com.my` serving (Phase 2); payment and tier activation (Phase 3, until then an
admin sets the tier like Kenang's manual activation); editing a live card; English UI; recolouring models; "Reka Khas" requests.

**Why the preview is design-only in Phase 1.** Showing the customer's own text and photos in the card needs a build (10 to 20 s) on the build server, which is Phase 2. Phase 1
therefore previews what can switch instantly: the theme, the palette and the models, on a sample card in the customer's language. Their own details are checked and listed in the
form, and appear in the card as soon as Phase 2's "Kemas kini pratonton" button exists. If you would rather have the real preview first, Phase 2's build job can be pulled forward;
the form does not change either way.

## 2. Where it lives

| Piece | Where | Why |
|---|---|---|
| API (cards, assets, catalogue) | **Kenang's Worker** (`warkah-kenang/api`), new `routes/cards.ts` | Same login, sessions, D1, R2, rate limits, billing and admin; the API only accepts same-origin writes, so the screens must be served by the same Worker |
| Screens | **Kenang's Vite app**, new `src/screens/card-*.js` under `/app/cards` | Same `h()` DOM helper, Malay `t()` strings, styles and router; one app for the couple |
| Shared rules (schema, validation, system fields, slugs, samples, catalogue) | **`warkah-engine`**, packaged as a "card kit" | One definition of "a valid card" for the engine, the Worker and the browser |

**The card kit.** `npm run kit` in the engine bundles the plain-TypeScript/JS modules into `kit/` (one ESM file, types, and `catalogue.json`):
`validateEvent`, `completeDraft`, `metaFor`, `slugProblem`, `suggestSlug`, `sampleFor`, `previewDraft`, `BUILDER_STEPS`, `TIERS`, `ASSET_RULES`, plus new helpers (section 6).
Kenang depends on it with `"@warkah/card-kit": "file:../warkah-engine/kit"` while both repos sit side by side; if they move to one monorepo or a private package later, only that line changes.
The kit has a version; the API stores it with every draft so an old draft is validated by the rules it was written under.

## 3. Data (D1 migration 0013)

```sql
CREATE TABLE cards (
  id              TEXT PRIMARY KEY,
  owner_user_id   TEXT NOT NULL REFERENCES users(id),
  wedding_id      TEXT REFERENCES weddings(id),     -- linked or created at publish (Phase 2), so Kenang gets a wedding for free
  slug            TEXT NOT NULL UNIQUE,             -- the card's address: kad.warkah.com.my/<slug>/
  lang            TEXT NOT NULL DEFAULT 'ms' CHECK (lang IN ('ms','en')),
  tier            TEXT NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic','full','custom')),   -- written only by billing / admin, never from a client request
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','paid','live','archived')),
  draft_json      TEXT NOT NULL DEFAULT '{}',       -- only what the customer typed or chose (no system fields, no sample content)
  draft_version   INTEGER NOT NULL DEFAULT 1,       -- bumped on every save: optimistic locking
  kit_version     TEXT NOT NULL,
  live_json       TEXT,                             -- the last published event.json (Phase 2)
  published_at    INTEGER,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);
CREATE INDEX cards_owner ON cards(owner_user_id);

CREATE TABLE card_assets (
  id           TEXT PRIMARY KEY,
  card_id      TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,                       -- a key of ASSET_RULES: cover, portrait, gallery, gift, qr, music
  path         TEXT NOT NULL,                       -- where it will sit in the card: gallery/3.webp, portrait/groom.webp, duitnow/qr.png ...
  r2_key       TEXT NOT NULL,                       -- cards/<card id>/<path>
  bytes        INTEGER NOT NULL,
  width        INTEGER, height INTEGER,             -- images (the card needs them for the gallery)
  content_type TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  UNIQUE (card_id, path)
);
```

Only `draft_json` holds customer words. Everything else (hosting, store, meta, sample filler) is added at preview/build time by `completeDraft` and `previewDraft`, so a draft never contains
data the customer did not write, and an engine change to the defaults needs no data migration.

Limits (like Kenang's "3 weddings per user"): 3 cards per user, 1 live card per wedding, assets per card capped by `ASSET_RULES` (gallery 12, gifts 20 ...).

## 4. API (all under `/api`, same-origin, session required, JSON unless noted)

| Route | Purpose |
|---|---|
| `GET /catalogue` | The kit's catalogue (themes, palettes, models, features, tiers, steps, asset rules, samples). Public, cached for an hour, no personal data |
| `GET /cards` | The user's cards: id, slug, theme, status, tier, names, updated, completeness |
| `POST /cards` `{ lang, theme }` | New draft. The slug is suggested from the names once step 1 is filled; until then a temporary `kad-<random>`. 403 `card_limit` past 3; rate limited |
| `GET /cards/:id` | `{ card, draft, status: { problems, missing, ready }, allowed: { features }, assets }` |
| `PATCH /cards/:id` `{ baseVersion, patch }` | JSON merge patch on `draft_json`, **autosave**. 409 `stale` (with the current draft) if `baseVersion` is old. Returns the new version and the status block. A bad value is saved but reported in `problems`; a feature outside the tier is refused (403 `not_in_tier`) |
| `GET /cards/:id/slug?value=` | `{ ok, problem }`: format, reserved words, taken. `PATCH` with `{ slug }` only while status is `draft` |
| `POST /cards/:id/assets` (multipart: `kind`, `file`, and `slot` for portrait/gift) | Checks the type by content (not the name), size and dimensions against `ASSET_RULES`, stores in R2, assigns the canonical path, and adds it to the draft (gallery entry with width/height, `portraits`, `meta.ogImage`, `duitnow.image`, `music.src`, gift image). Returns the asset and the new draft version |
| `DELETE /cards/:id/assets/:assetId` | Removes the file and its reference |
| `GET /media/cards/:id/*` | Serves the owner's own uploads for the editor (never public; the public copy is part of the built card in Phase 2) |
| `POST /cards/:id/preview`, `POST /cards/:id/publish` | **Contract only in Phase 1** (return 501); built in Phases 2 and 3 |

Status block, computed by the kit (so the browser and the API agree): `problems` = schema errors on fields the customer has filled in (Malay messages, field label, path);
`missing` = required fields still empty, in step order, with the step id so the UI can jump to it; `ready` = no problems and nothing missing.
It works on `previewDraft(completeDraft(draft))` so the schema can be reused unchanged: errors on sample-filled fields are dropped, and a missing required field is read from `BUILDER_STEPS`.

Errors are `{ error: "<code>" }` with the codes above plus `invalid_input` and `rate_limited`, like Kenang's routes.

Rate limits (Kenang's `allow()`): create 10 per hour, save 120 per minute per card, upload 40 per hour.

Tier rule: `TIERS[tier].features` is the allowed set. The API enforces it on every patch, and the UI shows locked features with a padlock and "Naik taraf" instead of hiding them.

## 5. The screens

Routes: `/app/cards` (list), `/app/cards/new`, `/app/cards/:id/:step` (step ids: `pasangan`, `majlis`, `gaya`, `gambar`, `tambahan`, `terbit`). Mobile first; at 900 px and wider the preview sits beside the form.

```
 phone                                         desktop
 +---------------------------+                +-------------------------------+---------------+
 | < Kad Aisyah & Hafiz  ... |  header        | Pasangan  Majlis  Gaya ...     |   +---------+ |
 | 1 Pasangan  2 Majlis  3 .. |  step tabs    | Nama panggilan pengantin lelaki|   | preview | |
 |---------------------------|                | [ Muhammad Hafiz          ]    |   | (iframe)| |
 | Nama panggilan pengantin  |                | ...                            |   |         | |
 | [ Muhammad Hafiz        ] |  fields        |                                |   +---------+ |
 | ...                       |                | Disimpan 14:02   3 belum lengkap [Seterusnya] |
 |---------------------------|                +-------------------------------+---------------+
 | Disimpan 14:02            |  footer: save state, missing count, [Seterusnya]
 | [ Pratonton ]             |  opens the preview as a bottom sheet
 +---------------------------+
```

Behaviour:
- **Autosave**: 800 ms after the last keystroke the changed fields are PATCHed with `baseVersion`; the footer shows "Menyimpan..." then "Disimpan 14:02". Offline or a failed save keeps the text in the page and retries; a 409 offers "Muat semula versi terbaru".
- **Field renderers by `kind`** (one small function each, all reading `BUILDER_STEPS`): text, longtext, **lines** (one box per line; stored as `<br>` HTML by the kit's `linesToHtml`), **datetime** (date and time inputs; stored as ISO with +08:00; the end time defaults to start + 5 hours), url (with a "Cara dapatkan pautan" hint), number, select, **image / images** (see below), **list** (rows with add/remove/reorder for aturcara, contacts, gifts and dress-code colours), **theme**, **palette**, **model**, **song**, **toggle**.
- **Theme picker**: cards with the `opening` and `classic` thumbnails, the label, the description and a "Melayu" / "Moden" badge from `culture`. Choosing resets nothing the customer typed.
- **Palette picker**: swatch chips (`swatch`), and the `home` and `details` thumbnails of the highlighted one; the preview recolours instantly with `?palette=`.
- **Model picker**: two grids (groom, bride) from `models` filtered by `who`; the ones matching the theme's `culture` are listed first and marked "Sesuai dengan tema"; a "Ikut tema" tile means "use the theme default" (no `couple.model` entry). Hidden when the mempelai pages are switched off.
- **Features (Tambahan)**: the `FEATURES` list as switches with the label and description. Ticking one reveals only its own fields (the `feature` flag on each builder field); a switched-off feature's fields are removed from the form and flagged "tidak disertakan" in the summary. Locked ones show a padlock.
- **Uploads**: the browser shrinks and converts to WebP first (canvas, `maxLongEdge` and quality from `ASSET_RULES`), shows a progress bar and the final size, then sends it; the server re-checks everything. Gallery images are reorderable. QR images are not recompressed (kept PNG).
- **Terbit (Semak & terbit)**: the `missing` list with "Pergi ke" links, the problems, a summary of what is switched on, the tier and price (placeholder text until pricing is confirmed), and the address with its availability check. The Publish button is disabled in Phase 1 with "Akan dibuka tidak lama lagi".
- **Language**: Malay strings through Kenang's `t()` (the Malay text is the key), so English later is a dictionary, as in the engine.
- **Accessibility**: real labels and `aria-live` for save state and errors, 44 px targets, visible focus, keyboard-operable list editors, respects reduced motion.

## 6. Instant preview (design choices only)

- `npm run previews` in the engine builds the 8 sample cards (4 themes x 2 languages) with base `/preview/<theme>-<lang>/` and **all** models shipped (a flag that makes `stageModels` copy the whole library), into `previews/`.
  Kenang's build copies them into its `public/preview/`. They carry `noindex` and never leave the app.
- The preview iframe loads `/preview/<theme>-<lang>/?palette=<id>&groom=<id>&bride=<id>`. `?palette=` already works; `?groom=` / `?bride=` are a new few lines in `card.js` that swap the model image `src`
  (the preview samples already have models, so no scene change is needed). Choosing a theme swaps the iframe URL.
- Not shown: the customer's own words and photos (Phase 2).

## 7. New helpers needed in the engine / kit

| Helper | What |
|---|---|
| `draftStatus(draft, tier, lang)` | `{ problems, missing, ready }` as in section 4 |
| `linesToHtml(lines)` / `htmlToLines(html)` | plain lines <-> the `<br>` HTML the schema stores (escapes `& < >`; keeps the existing "& " second-parent convention) |
| `toIso(date, time)` / `fromIso(iso)` | the datetime field <-> ISO with +08:00 |
| `sanitizeDraft(draft)` | for every field the card renders as HTML (`parentsHtml`, the `text.*Html` fields) allow only `<br>` and entities; everything else is escaped. Run on every save |
| `checkUrl(kind, url)` | https only; Maps / Waze links must be on Google or Waze hosts; gift links https |
| `imageInfo(bytes)` | type and width/height of a JPEG, PNG or WebP (the Worker has PNG parsing; add the other two) |
| `npm run kit`, `npm run previews` | the packaging and the preview build |
| `?groom=` / `?bride=` in `card.js` | the model swap for previews |
| Tests | kit unit tests (existing runner) for every helper above |

## 8. Security and abuse

- Every route checks ownership of the card; `tier` and `status` are never accepted from a request.
- Uploads are sniffed by content, size-capped by `ASSET_RULES`, stored under server-assigned paths (never the customer's filename), SVG and anything not in the rules is refused.
- All customer HTML is built from plain lines on the server (`sanitizeDraft`), so no script or markup can reach `set:html` in a card.
- URLs are checked (`checkUrl`); the card already renders them as links with `rel="noopener"`.
- Rate limits as above; 3 cards per user; drafts untouched for 90 days are archived and their files deleted (a daily job, like Kenang's cleanup).
- Personal data: drafts hold names, parents, phone numbers and photos, so access is owner-only, deletion is a real delete (rows and R2 objects), and the privacy text must say what is stored. Guests' RSVPs and wishes are separate and unchanged.

## 9. Testing

- Kit: unit tests (existing `npm test`) for the new helpers, plus a test that every `BUILDER_STEPS` field path exists in the schema.
- API: Vitest in the Workers runtime like Kenang's: ownership, limits, optimistic locking, tier enforcement, upload rejection (wrong type, too large, wrong dimensions), slug rules, sanitising.
- Screens: a scripted headless-Chrome walk (the approach used for the theme screenshots) filling a whole draft at 390 px and checking the status block and no console errors;
  a real-phone checklist (Safari and Chrome): typing, photo picker from the camera roll, keyboard covering fields, the bottom-sheet preview.

## 10. Build order (est. about 3 weeks)

1. **Kit and engine helpers** (3 days): section 7, `npm run kit`, `npm run previews`, the `?groom=` swap.
2. **API** (4 days): migration 0013, routes, tests. Includes tier enforcement and uploads.
3. **App shell and steps 1 to 3** (4 days): routes, autosave, text / lines / datetime / select fields, theme, palette, model pickers, instant preview.
4. **Steps 4 and 5** (4 days): uploads, list editors (aturcara, contacts, gifts, dress code), feature toggles with tier locks.
5. **Terbit step and completeness** (2 days): missing list, problems, address check, summary.
6. **QA and polish** (3 days): the scripted walk, the phone checklist, empty and error states, copy review in Malay.

## 11. Decisions for you

1. **Builder inside Kenang's app and Worker** (my recommendation: shared login, one app for the couple, no cross-origin problems) or a separate app with its own login?
2. **Link to the wedding at publish.** A card gets (or creates) a Kenang wedding when it is published, using the card's slug, so the Kenang link and the card share one address. OK?
3. **One live card per wedding**, up to 3 drafts per user. Does a couple with two majlis (akad and resepsi) need two cards, as Kenang's "Penuh" has two events?
4. **Preview in Phase 1 is design-only** (section 1). Fine, or pull the build-on-demand preview into Phase 1?
5. **The kit as a `file:` dependency** while both repos sit side by side, moving to a monorepo or private package later. OK?
6. **Where the builder app is served from** (today Kenang is on `kenang.aimanhakimcy.com`): keep that address for now and move to a Warkah domain later, or set the Warkah address up first?
7. **Tier before payment**: until Phase 3, an admin sets a card's tier (like Kenang's manual activation); until then every new draft is `basic`. OK?
