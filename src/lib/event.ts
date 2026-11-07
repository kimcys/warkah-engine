// Loads the client chosen by the EVENT env var and works out everything the page needs
// (Malay dates, full URLs, asset paths, data for the browser script).
import { getEntry } from "astro:content";
import warkah from "../../warkah.config.json";
import { themes } from "../themes";
import modelLibrary from "../../models/library.json";
import { browserStrings, makeT, type Lang } from "./i18n";
import { DAYS, MONTHS, partsIn, time12 } from "./dates.js";
import { BROWSER_KEYS } from "./i18n/browser-keys";
import { localise } from "./localise";

export async function loadEvent() {
  const slug = process.env.EVENT;
  if (!slug) {
    throw new Error("No client chosen. Run `npm run dev -- <client>` or `npm run build -- <client>` (folder name in events/).");
  }
  const entry = await getEntry("events", slug);
  if (!entry) {
    throw new Error(`events/${slug}/event.json was not found.`);
  }
  // A switched-off feature hides its data from every component (music, dressCode); the page switches are in sections.ts.
  const f = entry.data.features;
  const data = localise(entry.data, entry.data.lang);
  const e = { ...data, music: f.music ? data.music : undefined, dressCode: f.dressCode ? data.dressCode : undefined };
  const theme = themes[e.theme];
  const lang: Lang = e.lang;
  const t = makeT(lang);

  // Colour option: "classic" = the theme as designed; others override CSS variables and tint the artwork (see Palette).
  const paletteId = e.palette;
  const chosen = paletteId === "classic" ? undefined : theme.palettes[paletteId];
  if (paletteId !== "classic" && !chosen) {
    throw new Error(`events/${slug}/event.json: palette "${paletteId}" is not offered by theme "${e.theme}". Choose one of: classic, ${Object.keys(theme.palettes).join(", ") || "(none)"}`);
  }
  // Every palette's CSS is in the page, keyed by html[data-palette]; the chosen one is set on <html> (and ?palette=id previews any).
  const safe = (v: string) => !/[;{}<>]/.test(v);
  const paletteCss = Object.entries(theme.palettes).map(([id, p]) => {
    const vars = Object.entries(p.vars).filter(([, v]) => safe(v)).map(([k, v]) => `${k}:${v}`).join(";");
    const t = p.tint;
    return `html[data-palette="${id}"]{${vars}}` +
      (t ? `html[data-palette="${id}"] :is(.background-layer,.scene-layer,.opening-screen img){filter:hue-rotate(${Number(t.hue ?? 0)}deg) saturate(${Number(t.saturate ?? 1)}) brightness(${Number(t.brightness ?? 1)})}` : "");
  }).join("\n");
  const palette = { id: paletteId, css: paletteCss, ids: Object.keys(theme.palettes), themeColor: chosen?.themeColor ?? theme.themeColor, petals: chosen?.petals ?? theme.client.petals };

  const s = partsIn(e.date.start, e.date.timeZone);
  const end = partsIn(e.date.end, e.date.timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = {
    dayName: DAYS[lang][s.weekday],                                   // Sabtu
    dotted: `${pad(s.d)}.${pad(s.m)}.${s.y}`,                   // 12.12.2026
    long: `${s.d} ${MONTHS[lang][s.m - 1]} ${s.y}`,                   // 12 Disember 2026
    day: String(s.d), month: MONTHS[lang][s.m - 1], year: String(s.y),
    timeRange: `${time12(s.h, s.min)} – ${time12(end.h, end.min)}`  // 11:00 AM – 4:00 PM
  };

  const base = e.hosting.base;                                  // "/", "/demo/royal-gold/" or "/<slug>/" (builder cards)
  // Where the card lives: its own domain (builder cards: the card domain in system-fields.js), else the Firebase Hosting site <site>.web.app
  const host = e.hosting.domain || (e.hosting.site ? `${e.hosting.site}.web.app` : "");
  if (!host) throw new Error(`events/${slug}/event.json: hosting needs a "site" (Firebase Hosting) or a "domain".`);
  const siteUrl = `https://${host}${base}`;
  const asset = (path: string) => `${base}event/${path}`;       // client files (photos, song, QR)
  const themeAsset = (path: string) => `${base}theme/${path}`;  // theme files (backgrounds, css)

  // The figure on a groom/bride page: the client's choice, else the theme's default, else none (the theme's own artwork).
  const modelOf = (who: "groom" | "bride") => {
    const id = e.couple.model?.[who] ?? theme.defaultModels?.[who];
    const model = id ? modelLibrary.models.find((m) => m.id === id && m.who === who) : undefined;
    if (!model) return null;
    return { id: model.id, label: model.label, src: `${base}models/${model.file}` };
  };

  const [first, second] = e.couple.first === "groom" ? [e.couple.groom, e.couple.bride] : [e.couple.bride, e.couple.groom];

  const store =
    e.store.mode === "legacy"
      ? { mode: "firebase", config: e.store.firebaseConfig ?? null, root: "", publicCounts: false }
      : e.store.mode === "shared" && warkah.firebaseConfig.apiKey
        ? { mode: "firebase", config: warkah.firebaseConfig, root: `events/${slug}`, publicCounts: true }
        : { mode: "local", config: null, root: "", publicCounts: false };

  // Everything the browser script needs. Rendered into the page as JSON.
  const clientData = {
    slug,
    keyPrefix: e.store.localKey ?? `warkah-${slug}`,
    assets: `${base}event/`,
    store,
    theme: { ...theme.client, petals: palette.petals },
    i18n: browserStrings(lang, BROWSER_KEYS),   // English wording for card.js (empty for Malay)
    // false = nothing on the card reads or writes guest data (no RSVP, wishes or gifts), so the guestbook code is not started
    needsStore: e.features.rsvp || e.features.wishes || (e.features.gifts && e.gifts.items.length > 0),
    invitation: {
      eventTitle: e.meta.title,
      startDate: e.date.start,
      endDate: e.date.end,
      address: e.venue.address,
      googleMapsUrl: e.venue.maps,
      wazeUrl: e.venue.waze,
      calendarDescription: e.calendarDescription,
      contacts: e.contacts,
      duitnow: e.features.duitnow && e.duitnow.image ? { image: asset(e.duitnow.image), accountName: e.duitnow.accountName } : { image: "", accountName: "" },
      gifts: e.features.gifts ? e.gifts.items : [],
      groupGiftMinPrice: e.gifts.groupMinPrice,
      giftShop: e.gifts.shop,
      defaultWishes: e.defaultWishes,
      maxGuests: e.rsvp.maxGuests,
      features: e.features
    }
  };

  return {
    slug, e, theme, lang, t, date, base, siteUrl, asset, themeAsset, first, second, modelOf, palette, clientData,
    credit: warkah.credit,
    kenangHref: warkah.kenangEnabled && e.features.kenang ? `${warkah.kenangUrl.replace(/\/$/, "")}/${e.kenang.slug ?? slug}` : null,
    version: Date.now().toString(36)   // cache-busting tag for css/js on every build
  };
}

export type Card = Awaited<ReturnType<typeof loadEvent>>;

// JSON inside <script> must not contain "</script>".
export const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
