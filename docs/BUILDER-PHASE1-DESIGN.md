# Builder, Phase 1: the form and the drafts (design)

Status: **decisions confirmed** (section 11). **Revised 7 Nov 2026: the builder is its own product, Warkah Kad (`warkah-kad`), not part of Warkah Kenang.** Sections 2 and 11 say where it lives now; where the text below still says "Kenang's Worker/app", read "Warkah Kad's" (same design, same code, moved). Kenang's branch `builder-cards` is not merged and is kept only as history. Builds on `docs/BUILDER-PLAN.md` (Phase 0 is done: catalogue, form steps, Malay validation, samples, thumbnails, system fields, slugs).
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

Out of scope (later phases): building a card from the draft, the publish step and the `kad` host serving (Phase 2); payment and tier activation (Phase 3, until then an
admin sets the tier by hand); editing a live card; English UI; recolouring models; "Reka Khas" requests.

**Preview before purchase (a rule, not a nice-to-have).** The customer must see their *own* card, with their words, photos, colours and models, before they pay. So:
- Phase 1 shows what switches instantly: the theme, the palette and the models on a prebuilt sample card in their language (section 6A).
- **Phase 2 comes straight after and delivers the full preview** (section 6B): a real build of their draft, about 10 to 20 seconds, with a "Pratonton" ribbon, not indexed, no guest data kept.
- **Publishing and payment are blocked until the customer has seen a preview of the current draft** (the preview's built version must equal the draft's version; section 4). Editing after a preview needs a fresh preview.
- Until Phase 2 exists Phase 1 is an internal beta: the form and drafts work, but nothing can be bought. The core of the full preview already exists and is tested: `npm run preview -- <draft.json>` builds a real card from a draft (section 6B).

## 2. Where it lives

| Piece | Where | Why |
|---|---|---|
| API (cards, assets, catalogue, build jobs) | **Warkah Kad's Worker** (`warkah-kad/api`) | Its own sign-in (emailed code), D1 and R2. The API only accepts same-origin writes, so the screens are served by the same Worker |
| Screens | **Warkah Kad's Vite app** (`warkah-kad/src`): the landing page at `/`, sign-in and the builder under `/app/cards` | Plain JS with the `h()` DOM helper and Malay `t()` strings |
| Shared rules (schema, validation, system fields, slugs, samples, catalogue) | **`warkah-engine`**, packaged as a "card kit" | One definition of "a valid card" for the engine, the Worker and the browser |

**Addresses.** One Worker serves the landing page, the builder, the API, previews (`/p/<token>/`) and the finished cards (`/<slug>/`, static files from R2). Two settings: `PUBLIC_ORIGIN` (the site) and `CARD_HOST` (where cards are served; may be the same host, or a separate one, which keeps customers' cards off the builder's origin). Warkah Kad shares **nothing** with Warkah Kenang: no code, database, bucket, login or links. Today `kad.aimanhakimcy.com`, later `kad.warkah.com.my`.
The card domain is also a single setting in the engine (`CARD_DOMAIN` in `src/lib/system-fields.js`); moving to `warkah.com.my` means changing that line, `CARD_HOST` and the route, re-publishing live cards (a matrix job,
because their pages carry the old address) and **keeping the old domain redirecting**, since invitations already sent to guests contain the old links.

**The card kit.** `npm run kit` in the engine bundles the plain-TypeScript/JS modules into `kit/` (one ESM file, types, and `catalogue.json`):
`validateEvent`, `completeDraft`, `metaFor`, `calendarTextFor`, `slugProblem`, `suggestSlug`, `sampleFor`, `previewDraft`, `BUILDER_STEPS`, `TIERS`, `ASSET_RULES`, plus new helpers (section 7).
Warkah Kad depends on it with `"@warkah/card-kit": "file:../warkah-engine/kit"` while both repos sit side by side. **The engine repository stays private and is never shared with customers or published**:
Warkah Kad's build bundles only the kit's modules (schema, validation, catalogue, samples: nothing secret), the built cards contain no source, and CI (GitHub Actions) reads the engine through a private deploy key.
The kit has a version; the API stores it with every draft so an old draft is validated by the rules it was written under.

## 3. Data (D1 migration 0013)

```sql
CREATE TABLE cards (
  id              TEXT PRIMARY KEY,
  owner_user_id   TEXT NOT NULL REFERENCES users(id),
  slug            TEXT NOT NULL UNIQUE,             -- the card's address: <card domain>/<slug>/
  lang            TEXT NOT NULL DEFAULT 'ms' CHECK (lang IN ('ms','en')),
  tier            TEXT NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic','full','custom')),   -- written only by billing / admin, never from a client request
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','paid','live','archived')),
  draft_json      TEXT NOT NULL DEFAULT '{}',       -- only what the customer typed or chose (no system fields, no sample content)
  draft_version   INTEGER NOT NULL DEFAULT 1,       -- bumped on every save: optimistic locking
  kit_version     TEXT NOT NULL,
  preview_version INTEGER,                          -- the draft_version the latest preview was built from (the purchase gate, section 4)
  preview_token   TEXT,                             -- unguessable; the preview lives at /preview/<token>/ for 7 days
  preview_expires INTEGER,
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

Limits: 3 cards per user, assets per card capped by `ASSET_RULES` (gallery 12, gifts 20 ...).

## 4. API (all under `/api`, same-origin, session required, JSON unless noted)

**Status: built and tested in `warkah-kad`** (first built in Kenang's branch `builder-cards`, then moved): migration `0013_cards.sql`, `src/routes/cards.ts`, `src/lib/cards.ts`, `src/lib/card-assets.ts`, admin routes, the idle-draft cleanup, and `test/cards.test.ts` (40 tests; the whole suite is 39 files, 562 tests, and `wrangler deploy --dry-run` bundles it).
Additions to the table below: `PUT /cards/:id/slug`, `GET /admin/cards?q=` and `PATCH /admin/cards/:id { tier }` (an admin sets the package). Upload errors: 413 `too_large`, 415 `unsupported_type` (wrong or renamed file, animated image), 422 `image_too_small` / `image_too_large`, 409 `too_many`.
Only the `lang`, `theme`, `palette`, `couple`, `host`, `date`, `venue`, `aturcara`, `music`, `gallery`, `contacts`, `rsvp`, `features`, `gifts`, `duitnow`, `dressCode` and `ayat` parts of a draft can be patched; paths to uploaded files may only be the canonical ones.
Gift photos must be WebP (the card looks for `gifts/<id>.webp`), the cover a JPEG, and the browser converts before sending.


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
| `GET /cards/:id/files/<path>` | Serves the owner's own uploads for the editor (never public, `Cache-Control: private`; the public copy is part of the built card in Phase 2). It lives under `/api/cards` rather than `/media/cards/...` so no event slug can ever clash with it |
| `POST /cards/:id/preview` | Phase 2. Queues a preview build of the current draft; returns `{ jobId }`. Rate limited (20 per hour) |
| `GET /cards/:id/preview` | `{ state: none / queued / building / ready / failed, builtVersion, stale: builtVersion != draft_version, url, expiresAt, error }` |
| `POST /cards/:id/publish` | Phase 3. **Refused (409 `preview_required`) unless `preview_version == draft_version`** and the status block is `ready`, then needs the tier paid or admin-granted |

In Phase 1 the three preview/publish routes exist as stubs (501) so the screens can be built against the final contract.

Status block, computed by the kit (so the browser and the API agree): `problems` = schema errors on fields the customer has filled in (Malay messages, field label, path);
`missing` = required fields still empty, in step order, with the step id so the UI can jump to it; `ready` = no problems and nothing missing.
It works on `previewDraft(completeDraft(draft))` so the schema can be reused unchanged: errors on sample-filled fields are dropped, and a missing required field is read from `BUILDER_STEPS`.

Errors are `{ error: "<code>" }` with the codes above plus `invalid_input` and `rate_limited`, like the other routes.

Rate limits (`allow()`): create 10 per hour, save 120 per minute per card, upload 40 per hour.

Tier rule: `TIERS[tier].features` is the allowed set. The API enforces it on every patch, and the UI shows locked features with a padlock and "Naik taraf" instead of hiding them.

**Found while building step 2 (all fixed in the engine):** a missing cover was reported twice by `draftStatus`; the venue's Maps / Waze QR paths defaulted to files a builder card does not have (system fields now set them to empty, meaning "no QR"; generating real QR images from the links is a nice-to-have for Phase 2).

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
- **Language**: Malay strings through `t()` (the Malay text is the key), so English later is a dictionary, as in the engine.
- **Accessibility**: real labels and `aria-live` for save state and errors, 44 px targets, visible focus, keyboard-operable list editors, respects reduced motion.

## 6. Previews

**6A. Instant design preview (Phase 1).**
- `npm run previews` in the engine builds the 8 sample cards (4 themes x 2 languages) with base `/preview/<theme>-<lang>/` and **all** models shipped (a flag that makes `stageModels` copy the whole library), into `previews/`. Kenang's build copies them into its `public/`. They carry `noindex`.
- The iframe loads `/preview/<theme>-<lang>/?palette=<id>&groom=<id>&bride=<id>`. `?palette=` already works; `?groom=` / `?bride=` are a few new lines in `card.js` that swap the model image `src` (the samples already have models, so no scene change is needed). Choosing a theme swaps the iframe URL.
- It shows sample people and sample words, labelled "Contoh" in the frame, so nobody mistakes it for their card.

**6B. Full preview of the customer's own card (Phase 2, required before purchase).**
- A build job on the build server (DigitalOcean, queue; GitHub Actions only for checks): take `draft_json` and the card's R2 files, run `previewDraft` then `completeDraft`, mark `preview: true`, `store: demo`, base `/preview/<token>/`, build, upload to R2, record `preview_version`.
- The card carries a **"Pratonton" ribbon**, `noindex`, and keeps no guest data (RSVPs, wishes and gifts go to the browser only). The link is unguessable and expires after 7 days, so the couple can show family before paying; a new build replaces it.
- A preview is only built when the required fields are complete, so it never needs sample words for anything identifying. It may still use the sample **photos** as placeholders for a feature ticked without uploads; **publishing never fills anything from the sample** (the status block requires the data of every ticked feature: photos for the gallery, items for gifts, an image for DuitNow ...).
- **Already built and tested in the engine:** `npm run preview -- <draft.json> [--assets <folder>] [--name <slug>] [--build]` does exactly this on a laptop, `preview: true` gives the ribbon and `noindex`, and sample people, hashtags, phone numbers, RSVP dates and the page title can never leak into a customer's card (a test checks it). Phase 2 wraps this in the queue.

**6B status: built and tested end to end on a laptop.** The build server is a pull worker, `scripts/build-server.mjs` (`KAD_URL`, `BUILD_SECRET`, `npm run build-server`): it claims a job from Warkah Kad's `/api/build/claim`, downloads the draft and files, runs `scripts/build-job.mjs` (a card takes about 1.5 seconds to build), uploads the result and reports done or failed. Nothing connects in to it. Differences from the sketch above: previews are served at `/p/<token>/` (not `/preview/<token>/`, which holds the instant samples), the token is created at the first request and **stays the same across rebuilds** (the old preview keeps working until the new one is ready), the preview is only built from a complete card (409 `not_ready`), a build that goes quiet for 5 minutes is retried up to 3 times, and the served page carries `noindex`, no referrer and a CSP `sandbox` so it cannot reach the app's cookies or API.

**Publish: built and tested end to end on a laptop** (the same queue as previews, `kind = 'publish'`). `POST /cards/:id/publish` is refused with 402 `payment_required` until an admin marks the card paid (`PATCH /admin/cards/:id {paid: true}`; online payment will do this later), 409 `not_ready` unless the status block is ready, and 409 `preview_required` unless the preview was built from the card as it is now. The job remembers the version the customer previewed; if the card was edited before the build server claimed it the job fails with `changed` and nothing is built from unseen content. The build (`scripts/build-job.mjs`, `src/lib/publish.js`) makes the real card: no ribbon, shared store, base `/<slug>/`, **no sample photos at all**, and it fails with the list of any file the card refers to that is missing. The files go to `live/<slug>/<job>/` in R2 and the card becomes `live`; publishing again replaces them under the same address and deletes the old ones, a failed build changes nothing. A live card can be edited (the live version stays until it is published again, and the screen says "changed"); its address is locked once live. On the card host (`CARD_HOST`) `/<slug>/` is served from R2; the Worker now answers first for every path except the static folders and hands the rest to `ASSETS`. Published cards carry `<meta robots noindex>` (the engine does that for any card under a path): wedding invitations are private, so this is kept. **No link to Kenang** (decision 2 was dropped on 7 Nov 2026): publishing does not create or link anything outside Warkah Kad. **Unpublish (built):** `POST /cards/:id/unpublish` takes a live card down at once (the address answers not found, the files are deleted), cancels any publish still waiting, and leaves the card `paid`, so it can be edited and published again; its address can change again. **Not built yet:** payment.

## 7. New helpers needed in the engine / kit

**Status: built and tested (step 1 of section 10 is done).** `npm run kit` packages them; `npm test` has 7 test files and fails if `kit/` is stale. Differences from the first sketch: `draftStatus` returns `locked` (a switch outside the package, or not offered)
instead of a tier list and takes the `assets` list to check uploaded files; `effectiveFeatures(draft, tier)` is new (the build applies the package with it); the programme is required only while the programme page is on; the cover image is now a required field;
`checkUrl` and `LIMITS` (rows per list) are used by `draftStatus`; every helper is safe on garbage input (a test feeds it 29 odd shapes).

| Helper | What |
|---|---|
| `draftStatus(draft, tier, lang)` | `{ problems, missing, ready }` as in section 4. `missing` also covers the data of every ticked feature (a ticked gallery with no photo, gifts with no items ...) |
| `linesToHtml(lines)` / `htmlToLines(html)` | plain lines <-> the `<br>` HTML the schema stores (escapes `& < >`; keeps the existing "& " second-parent convention) |
| `toIso(date, time)` / `fromIso(iso)` | the datetime field <-> ISO with +08:00 |
| `sanitizeDraft(draft)` | for every field the card renders as HTML (`parentsHtml`, the `text.*Html` fields) allow only `<br>` and entities; everything else is escaped. Run on every save |
| `checkUrl(kind, url)` | https only; Maps / Waze links must be on Google or Waze hosts; gift links https |
| `imageInfo(bytes)` | type and width/height of a JPEG, PNG or WebP (the Worker has PNG parsing; add the other two) |
| `npm run kit`, `npm run previews` | the packaging and the instant-preview build |
| **Done already** | `preview` flag + ribbon, `npm run preview`, `PERSONAL_FIELDS` (never copied from the sample), `calendarTextFor`, the card domain as one setting, `offered: false` for Kenang and guestName |
| `?groom=` / `?bride=` in `card.js` | the model swap for previews |
| Tests | kit unit tests (existing runner) for every helper above |

## 8. Security and abuse

- Nothing about the sample's people can reach a customer's card (`PERSONAL_FIELDS` + a leak test); the builder does not offer the Kenang add-on and no builder card links to the Kenang site.
- Every route checks ownership of the card; `tier` and `status` are never accepted from a request.
- Uploads are sniffed by content, size-capped by `ASSET_RULES`, stored under server-assigned paths (never the customer's filename), SVG and anything not in the rules is refused.
- All customer HTML is built from plain lines on the server (`sanitizeDraft`), so no script or markup can reach `set:html` in a card.
- URLs are checked (`checkUrl`); the card already renders them as links with `rel="noopener"`.
- Rate limits as above; 3 cards per user; drafts untouched for 90 days are archived and their files deleted (a daily job).
- Personal data: drafts hold names, parents, phone numbers and photos, so access is owner-only, deletion is a real delete (rows and R2 objects), and the privacy text must say what is stored. Guests' RSVPs and wishes are separate and unchanged.

## 9. Testing

- Kit: unit tests (existing `npm test`) for the new helpers, plus a test that every `BUILDER_STEPS` field path exists in the schema.
- API: Vitest in the Workers runtime: ownership, limits, optimistic locking, tier enforcement, upload rejection (wrong type, too large, wrong dimensions), slug rules, sanitising.
- Screens: a scripted headless-Chrome walk (the approach used for the theme screenshots) filling a whole draft at 390 px and checking the status block and no console errors;
  a real-phone checklist (Safari and Chrome): typing, photo picker from the camera roll, keyboard covering fields, the bottom-sheet preview.

## 10. Build order (est. about 3 weeks for Phase 1, then Phase 2 straight after)

1. **Kit and engine helpers: DONE.** Section 7, `npm run kit`, `npm run previews`, the `?groom=` / `?bride=` swap.
2. **API: DONE** (migration 0013, routes, tier enforcement, uploads, admin tier, cleanup, 40 tests). **Host-based routing for the `kad` host is deferred to step 3**: it needs the DNS and Worker route, an origin chosen per host for emails and links, and it cannot be tested without a deploy; it is better done together with the screens it serves.
3. **App shell and steps 1 to 3** (4 days): routes, autosave, text / lines / datetime / select fields, theme, palette, model pickers, instant preview.
4. **Steps 4 and 5** (4 days): uploads, list editors (aturcara, contacts, gifts, dress code), feature toggles with tier locks.
5. **Terbit step and completeness** (2 days): missing list, problems, address check, summary.
6. **QA and polish** (3 days): the scripted walk, the phone checklist, empty and error states, copy review in Malay.
7. **Then Phase 2 (est. 1 to 2 weeks): the full preview job** (section 6B), the `kad` host serving previews and published cards from R2, publish, and the purchase gate. Nothing is sold before this.

## 11. Decisions (confirmed)

| # | Decision |
|---|---|
| 1 | The builder is its own product, **Warkah Kad** (`warkah-kad`): its own Worker, D1, R2, sign-in and landing page. It does not live in Kenang (revised 7 Nov 2026) |
| 2 | ~~A card gets a Kenang wedding when published~~ **Dropped** (7 Nov 2026): the two products share nothing |
| 3 | Up to 3 drafts per user (the "one live card per wedding" rule went with the wedding link) |
| 4 | Best possible preview, and **always a full preview of the customer's own card before they can buy** (section 6, the purchase gate) |
| 5 | **The engine repository is never shared with customers.** Warkah Kad consumes the kit as a local `file:` dependency; only the kit's modules are bundled |
| 6 | Cards and the builder are served from **`kad.aimanhakimcy.com`**, later **`kad.warkah.com.my`** (settings `PUBLIC_ORIGIN` and `CARD_HOST`); Warkah Kad does not link to Kenang and Kenang does not link to it |
| 7 | Until payment exists an **admin sets the tier** (by hand); every new draft starts as **Asas** (`basic`) |
