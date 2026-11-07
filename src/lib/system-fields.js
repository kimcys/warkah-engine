// The fields of event.json the customer never types. The builder adds them to a draft before it is validated, previewed or built:
//   hosting   served from kad.warkah.com.my/<slug>/ (no Firebase Hosting site)
//   store     "shared": RSVPs, wishes and gifts go to the shared Warkah project under events/<slug>
//   package   the default package id (the tier is decided by billing, not by this field)
//   meta      title, description and the preview text, written from the names, date and venue in the card's language
// Anything the draft already has is kept. Plain JavaScript (see sample-merge.js for why).
import { DAYS, MONTHS, partsIn } from "./dates.js";

export const CARD_DOMAIN = "kad.warkah.com.my";

export function builderHosting(slug) {
  return { domain: CARD_DOMAIN, base: `/${slug}/` };
}

/** The wedding's wording for the page title and WhatsApp preview. Returns {} while the names, date or venue are missing. */
export function metaFor(draft, lang = "ms") {
  const couple = draft?.couple, date = draft?.date, venue = draft?.venue;
  const groom = couple?.groom, bride = couple?.bride;
  if (!groom?.short || !bride?.short || !groom?.name || !bride?.name || !date?.start || !venue?.name) return {};
  const [a, b] = (couple.first || "groom") === "bride" ? [bride, groom] : [groom, bride];
  const when = partsIn(date.start, date.timeZone || "Asia/Kuala_Lumpur");
  const day = DAYS[lang][when.weekday];
  const long = `${when.d} ${MONTHS[lang][when.m - 1]} ${when.y}`;
  const where = [venue.name, venue.area].filter(Boolean).join(", ");
  return lang === "en"
    ? {
        title: `Wedding of ${a.short} & ${b.short}`,
        description: `Wedding invitation of ${a.name} & ${b.name}, ${day} ${long}, ${where}.`,
        ogAlt: `Wedding invitation of ${a.short} & ${b.short}, ${day} ${long}.`
      }
    : {
        title: `Majlis Perkahwinan ${a.short} & ${b.short}`,
        description: `Undangan Majlis Perkahwinan ${a.name} & ${b.name}, ${day} ${long}, ${where}.`,
        ogAlt: `Kad jemputan ${a.short} & ${b.short}, ${day} ${long}.`
      };
}

/** Adds the system fields to a customer's draft (a copy; nothing the draft already has is replaced). */
export function completeDraft(draft, { slug, lang } = {}) {
  const language = lang || draft?.lang || "ms";
  const out = structuredClone(draft ?? {});
  out.lang = out.lang || language;
  out.hosting = { ...builderHosting(slug), ...(out.hosting || {}) };
  out.store = out.store || { mode: "shared" };
  out.package = out.package || "signature";
  out.meta = { ...metaFor(out, language), ...(out.meta || {}) };
  return out;
}
