// Loads the client chosen by the EVENT env var and works out everything the page needs
// (Malay dates, full URLs, asset paths, data for the browser script).
import { getEntry } from "astro:content";
import warkah from "../../warkah.config.json";
import { themes } from "../themes";
import modelLibrary from "../../models/library.json";

const DAYS = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
const MONTHS = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];

function partsIn(iso: string, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short"
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(String(p.weekday));
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h: Number(p.hour), min: Number(p.minute), weekday };
}

function time12(h: number, min: number) {
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(min).padStart(2, "0")} ${suffix}`;
}

export async function loadEvent() {
  const slug = process.env.EVENT;
  if (!slug) {
    throw new Error("No client chosen. Run `npm run dev -- <client>` or `npm run build -- <client>` (folder name in events/).");
  }
  const entry = await getEntry("events", slug);
  if (!entry) {
    throw new Error(`events/${slug}/event.json was not found.`);
  }
  const e = entry.data;
  const theme = themes[e.theme];

  const s = partsIn(e.date.start, e.date.timeZone);
  const end = partsIn(e.date.end, e.date.timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = {
    dayName: DAYS[s.weekday],                                   // Sabtu
    dotted: `${pad(s.d)}.${pad(s.m)}.${s.y}`,                   // 12.12.2026
    long: `${s.d} ${MONTHS[s.m - 1]} ${s.y}`,                   // 12 Disember 2026
    day: String(s.d), month: MONTHS[s.m - 1], year: String(s.y),
    timeRange: `${time12(s.h, s.min)} – ${time12(end.h, end.min)}`  // 11:00 AM – 4:00 PM
  };

  const base = e.hosting.base;                                  // "/" or "/demo/royal-gold/"
  const host = e.hosting.domain || `${e.hosting.site}.web.app`;
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
    theme: theme.client,
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
    slug, e, theme, date, base, siteUrl, asset, themeAsset, first, second, modelOf, clientData,
    credit: warkah.credit,
    kenangHref: warkah.kenangEnabled && e.features.kenang ? `${warkah.kenangUrl.replace(/\/$/, "")}/${e.kenang.slug ?? slug}` : null,
    version: Date.now().toString(36)   // cache-busting tag for css/js on every build
  };
}

export type Card = Awaited<ReturnType<typeof loadEvent>>;

// JSON inside <script> must not contain "</script>".
export const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
