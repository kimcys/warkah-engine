# Warkah card: what every theme's UI must have

Use this when designing a new theme (or restyling one). Every theme is a **mobile-first invitation card**, designed at
390 x 844 (phone portrait). The engine fills in the words; the theme only decides the look.

## 1. The experience, in order
1. **Opening screen** with one button **"Buka Kad"** (`#openInvite`). Names of the couple, a short kicker line, a themed
   scene (storybook, mirror, gate...). Tapping it starts the music and shows the card.
2. **Pages**, one per screen, snapping as you scroll. A floating **frosted-glass panel** holds the text; behind it a **scene**
   (full-bleed artwork) cross-fades per page. A **page-dot indicator** sits on the right edge, a swipe hint on the first page.
3. **Bottom bar** always visible after the card opens (see section 4).
4. **Ambience**: soft sparkles / fairy lights and falling petals in the theme colours.

## 2. Mandatory pages (in the theme's own order; each has a scene behind it)
| # | Page | What it shows | Shown when |
|---|---|---|---|
| 1 | Hero | Names, date, "Walimatulurus"-style heading | always |
| 2 | Invitation (Jemputan) | Parents' wording, couple names, date and time | always |
| 3 | Venue sign | Venue name and area on a sign / board | `features.venueSign` |
| 4 | Ayat | Quranic verse: reference, Arabic, Malay | `features.ayat` |
| 5 | Groom | Name, full name, "Putera kepada", parents | `features.mempelai` |
| 6 | Bride | Name, full name, "Puteri kepada", parents | `features.mempelai` |
| 7 | Details | Date, time, venue, address, map and calendar buttons | always |
| 8 | Countdown | Days / hours / minutes / seconds to the event | `features.countdown` |
| 9 | Portraits | Couple portrait photo(s) | `features.portraits` |
| 10 | Gallery | Photo grid, tap for lightbox | `features.gallery` and photos exist |
| 11 | Programme | Timeline of the event | `features.programme` |
| 12 | Dress code | Colour palette and note | `features.dressCode` and the event has `dressCode` |
| 13 | Doa | Prayer for the couple | `features.doa` |
| 14 | RSVP | Summary and a button that opens the RSVP sheet | `features.rsvp` |
| 15 | Wishes (Ucapan) | Guests' messages, paged | `features.wishes` |
| 16 | Gifts (Hadiah) | Gift list and/or DuitNow QR | `features.gifts` or `features.duitnow` |
| 17 | Thanks | Closing thank-you | always |

A theme must **style all 17**, even though a client may switch some off. A page that is off simply isn't shown. Only hero, invitation, details and thanks are always on. Music (and its button) is also switchable (`features.music`).

## 3. Groom and bride models
- Each person gets their **own page and their own scene**: the figure stands full-height behind a frosted name panel that sits low,
  so the head and shoulders stay clear.
- The figures come from one shared library (`models/`, 3 grooms and 6 brides) and the **customer picks** one groom and one bride.
  A theme does not paint the couple itself: it only supplies a scene with nobody in it.
- Library art: faceless, standing, full length, transparent PNG about 1024 x 1536. Both **Malay** (white baju melayu, samping, songkok,
  kebaya) and **modern** (suit, gowns) outfits exist; a theme suggests the matching ones as defaults.
- The figure follows whoever is first in the couple (`couple.first`).

## 4. Bottom bar (identical in every theme)
At most **5 buttons**, in this order, a button simply disappears when its feature is off:
`Hadiah` · `Lokasi` · `Muzik` · `RSVP` · `Hubungi`
- Hadiah only when gifts or DuitNow is on. Kenangan (photobooth link) only takes a spare slot, never a 6th.
- Lokasi sheet: venue, Maps / Waze buttons, QR codes, and **"Simpan Tarikh ke Kalendar"** (calendar sheet).
- Muzik sheet: now-playing, Play/Pause. RSVP sheet: name, attendance, guests, optional wish. Hubungi: contact list.

## 5. Gift flow (page and Hadiah sheet behave the same)
- Only gifts on **or** only DuitNow on: show that one, **no tab bar**.
- Both on: a **tab bar** `Senarai Hadiah | DuitNow`; gifts tab has "Lihat Senarai Hadiah", DuitNow tab has the QR and "Simpan QR".

## 5b. Colour options (palettes)
Every theme offers its classic look plus **3 colour options** the customer can pick (label + 3-colour swatch each). A palette changes
the accent, text and panel colours; for themes with abstract artwork it also tints the scenes and the opening image. It never changes
the layout, the pages or the models.

## 6. Design rules every theme must follow
- Phone first, 390 x 844; text readable on the panel, minimum body text about 13 px.
- One **frosted panel** style for all pages; entrance by direction (left / right / zoom) with lines rising in one by one.
- Palette: 1 main, 1 accent, 1 background tone, plus petal colours (declare these as CSS variables in `:root` so palettes can override them); fonts: a script for names, a serif for body/headings, Arabic (Noto Naskh) for the ayat.
- Respect `prefers-reduced-motion` (no entrance animation then).
- Same controls everywhere: buttons (`primary` / `secondary` / `text`), tab bar, gift cards, form fields, lightbox, bottom sheets.
- Every scene image: about 1440 x 2560 or tintable from one artwork, optimised WebP, under about 200 KB each.

## 7. What a new theme must include (assets)
- Opening artwork, 3 to 6 scene backgrounds, groom and bride figures, favicon, preview image (`og-preview`).
- Names for the scenes used by the 17 pages, plus a decision for each page: panel position (`top` / `middle` / `bottom`) and reveal direction.
