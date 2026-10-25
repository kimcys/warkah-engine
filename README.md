# Warkah engine

One codebase for every Warkah card. A new client = one folder in `events/` (details + photos).
Built with [Astro](https://astro.build); each build makes one client's card for their own `<site>.web.app`.

```
events/                       ← one folder per client
  ezzan-nadiah/
    event.json                  names, date, venue, aturcara, contacts, features, gifts …
    assets/                     their files → served at /event/
      audio/song.m4a  gallery/1.webp …  portrait/  qr/  cover/og-preview.jpg  gifts/g1.webp …
    theme/                      (optional) replaces theme files for this client → /theme/
  demo-royal-gold/              catalogue demo (fake names, saves on the phone only)
src/
  content.config.ts           the "form" event.json must follow (the build stops if something is missing)
  themes/royal-gold/          theme: theme.ts (page order, scenes, effects), Opening.astro, Backdrop.astro, public/ (css, backgrounds)
  components/sections/        shared pages: Hero, Invitation, Mempelai, Details, Programme, Portraits, Gallery, Doa, Rsvp, Thanks
  components/panels/          bottom sheets: calendar, location, music, RSVP form, contacts, gifts
  pages/index.astro           the card      pages/admin.astro   couple's RSVP dashboard (/admin)
public/core/card.js           card behaviour (countdown, RSVP, wishes, gifts, music, lightbox) – shared by all cards
public/core/admin.js          dashboard behaviour
scripts/                      new / dev / build / deploy helpers
firestore.rules               rules for the shared Warkah Firebase project
warkah.config.json            shared Firebase project config + footer credit
```

## First-time setup

1. Install [Node.js 20+](https://nodejs.org) and the Firebase CLI: `npm install -g firebase-tools`, then `firebase login`.
2. In this folder: `npm install`
3. Try it: `npm run dev -- ezzan-nadiah` → open http://localhost:4321
   (and http://localhost:4321/admin for the dashboard). The demo: `npm run dev -- demo-royal-gold`.

### Shared Warkah Firebase project (once)

New cards store RSVPs in one Firebase project instead of one project per couple.

1. Create a Firebase project (the files assume the id `warkah-kad`; change `.firebaserc` and `warkah.config.json` if yours differs).
2. Add a **Web app**, copy its config into `warkah.config.json` → `firebaseConfig`.
3. Enable **Firestore** (region asia-southeast1) and **Authentication → Google** sign-in.
   In Authentication → Settings → Authorized domains, add each card's `<site>.web.app` (or `*.web.app` domains as you go).
4. In `firestore.rules`, replace `you@example.com` with your Google account, then `npm run deploy:rules`.

Until `firebaseConfig.apiKey` is filled in, new cards fall back to demo mode (RSVPs saved on the guest's phone only).

## New order (about an hour for a Signature card)

```bash
npm run new -- aiman-alyana                 # copies the Royal Gold demo into events/aiman-alyana/
# edit events/aiman-alyana/event.json, put photos / song / QR codes in events/aiman-alyana/assets/
npm run dev -- aiman-alyana                 # preview on localhost:4321 (restart after adding files)
firebase hosting:sites:create aimanalyana   # once per client (pick another name if it's taken)
npm run deploy -- aiman-alyana              # build + upload → https://aimanalyana.web.app
```

Before going live, in the Firebase console (Firestore) create the document **`events/aiman-alyana`** with a field
`owners` (array) = the couple's Google e-mails. Without it the card can't save RSVPs, and only owners can open `/admin`.

### What goes in event.json

The full list (with defaults) is in `src/content.config.ts`. The ones you always fill in:

| Field | Example |
|---|---|
| `theme` | `"royal-gold"` |
| `hosting.site` | `"aimanalyana"` → aimanalyana.web.app |
| `meta.title / description / ogAlt` | WhatsApp preview text |
| `couple.groom / bride` | name, full (bin/binti …), short, parentsHtml |
| `host.parents` | the inviting parents (1 or 2 names) |
| `date.start / end` | `"2026-12-12T11:00:00+08:00"` (day name, 12.12.2026, "12 Disember 2026" are worked out for you) |
| `venue` | name, area, address, maps, waze |
| `aturcara` | `[{ "icon": "makan", "label": "Jamuan Makan", "time": "11:00 AM – 4:00 PM" }]` (icons: makan, pengantin, bersurai, akad, doa, jam) |
| `contacts` | name, role, phone |
| `music.fallback` | optional second song file for browsers that cannot play the first: `{ "src": "audio/song.mp3", "type": "audio/mpeg" }` |
| `features` | add-ons on/off: `gifts`, `duitnow`, `kenang`, `gallery`, `portraits`, `doa`, `mempelai`, `wishes`, `rsvp` |
| `calendarDescription` | text for Google / Apple calendar |

Wording such as the doa, pantun and "Walimatul Urus" have defaults; set them under `text` only when a client wants different words.
Bride-side majlis: set `couple.first` to `"bride"` and `host.inviteRelation` to `"ke majlis perkahwinan puteri kami"`.

### Add-ons = switches

- Gift list: `"features": { "gifts": true }` + `gifts.items` (ids `g1`, `g2`, …; photos in `assets/gifts/g1.webp`). Gifts above `gifts.groupMinPrice` (RM500) can be shared.
- Warkah Kenang (photobooth + memory wall): `"features": { "kenang": true }` adds a camera button to the bottom bar that opens
  `<kenangUrl>/<slug>` (kenangUrl is in `warkah.config.json`). If the Kenang event uses a different slug, add `"kenang": { "slug": "…" }`.
  The Kenang page is created in the Kenang Studio (`/studio`). **Master switch:** `kenangEnabled` in `warkah.config.json` is `false` for now, so no card shows the button even where `features.kenang` is on; set it to `true` and redeploy a card to launch.
- DuitNow: `"features": { "duitnow": true }` + `"duitnow": { "image": "duitnow/qr.png", "accountName": "…" }`.
- Extra photos: add entries to `gallery`.
- Max guests per RSVP: `"rsvp": { "maxGuests": 2 }`.

## Themes

A theme is a folder in `src/themes/`:

- `theme.ts`: page order, which scene each page shows, theme colour, fonts, effects (fairy lights, petal colours).
- `Opening.astro`: the opening screen (must contain a `#openInvite` button).
- `Backdrop.astro`: scene layers / effect containers behind the pages.
- `public/`: `style.css`, backgrounds, opening image, favicon (served at `/theme/`).

Themes: `enchanted-garden` (the standalone Nadiah & Ezzan card in `kad-kahwin-nadiah-ezzan/`, ported: a gold mirror in the sky opens onto a garden poster, then arch / garden / sky scenes; preview with `npm run dev -- enchanted-demo`), `royal-gold`, `lover`, and `glasshouse` (the white glasshouse wedding from a concept video: each page is a cleaned video frame in `src/themes/glasshouse/public/bg/` with the card's own words laid on it; `src/themes/glasshouse/clean-frames.cjs` regenerates the frames. `scroll` in its `theme.ts` picks `"pages"` (Royal Gold style: snapping pages, scene camera move, lines rising in turn) or `"free"` (continuous scroll with per-line zoom-up)).

New theme: copy `royal-gold/`, change the art and CSS, register it in `src/themes/index.ts` and add its name to
`theme` in `src/content.config.ts`. All pages, RSVP, wishes, gifts and the dashboard work automatically.

## Data and privacy

- **Shared cards** (`store.mode: "shared"`): data under `events/<client>/` in the Warkah project.
  RSVPs with names are private (couple + Warkah only). The card counts guests from `rsvpPublic` (no names).
  Wishes and gift claims are public, because they are shown on the card.
- **Legacy** (`"legacy"`): an old card's own project with root collections. `ezzan-nadiah` uses this so its live RSVPs keep working.
  `events/ezzan-nadiah/firestore.legacy.rules` is that project's rules with the gift fix (g9, g10, g11 can be claimed). Deploy it to the
  ezzan-nadiah-wedding project when you're ready (copy it over that project's `firestore.rules` and run `firebase deploy --only firestore --project ezzan-nadiah-wedding`).
- **Demo** (`"demo"`): saved on the guest's phone only.

## Notes

- Each build only includes that client's files, so no other couple's photos end up on their site.
- `events/ezzan-nadiah/theme/` holds their backgrounds and favicon (with the "EN" crest). The Royal Gold theme's own
  `public/bg/` currently uses the same concept-video frames. **Replace them with original or licensed artwork before selling
  Royal Gold to other clients.**
- WhatsApp caches link previews. After changing the cover image, bump `meta.version`.
- Catalogue demos (`hosting.base` like `/demo/royal-gold/`) are built with `npm run build -- demo-royal-gold` and copied into
  the catalogue site's folder; `npm run deploy` refuses them so they don't overwrite the catalogue.
