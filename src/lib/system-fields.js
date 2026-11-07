// The fields of event.json the customer never types. The builder adds them to a draft before it is validated, previewed or built:
//   hosting   served from <card domain>/<slug>/ (no Firebase Hosting site)
//   store     "shared": RSVPs, wishes and gifts go to the shared Warkah project under events/<slug>
//   package   the default package id (the tier is decided by billing, not by this field)
//   meta      title, description and the preview text, written from the names, date and venue in the card's language
//   calendarDescription   the text of the calendar entry, from the same details
// Anything the draft already has is kept. Plain JavaScript (see sample-merge.js for why).
import { DAYS, MONTHS, partsIn } from "./dates.js";

// Where builder cards live. It is ONE setting: change this line (and the Worker's route) to move to kad.warkah.com.my; cards already published
// carry the old address in their pages, so they are re-published (a matrix job) and the old domain keeps redirecting, because invitations
// already shared with guests contain it.
export const CARD_DOMAIN = "kad.aimanhakimcy.com";

export function builderHosting(slug, domain = CARD_DOMAIN) {
  return { domain, base: `/${slug}/` };
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

/** The text a calendar entry gets (Google / Apple), written from the customer's own details. Returns "" while they are missing. */
export function calendarTextFor(draft, lang = "ms") {
  const couple = draft?.couple, date = draft?.date, venue = draft?.venue;
  const groom = couple?.groom, bride = couple?.bride;
  if (!groom?.name || !bride?.name || !date?.start || !venue?.name) return "";
  const [a, b] = (couple.first || "groom") === "bride" ? [bride, groom] : [groom, bride];
  const when = partsIn(date.start, date.timeZone || "Asia/Kuala_Lumpur");
  const long = `${DAYS[lang][when.weekday]} ${when.d} ${MONTHS[lang][when.m - 1]} ${when.y}`;
  const names = `${a.name} ${a.full || ""}`.trim() + " & " + `${b.name} ${b.full || ""}`.trim();
  const where = [venue.name, venue.area].filter(Boolean).join(", ");
  const tag = couple.hashtag ? ` ${couple.hashtag}` : "";
  return (lang === "en" ? `Wedding of ${names}. ${long}, ${where}.` : `Majlis Perkahwinan ${names}. ${long}, ${where}.`) + tag;
}

/** Adds the system fields to a customer's draft (a copy; nothing the draft already has is replaced). */
export function completeDraft(draft, { slug, lang, cardDomain } = {}) {
  const language = lang || draft?.lang || "ms";
  const out = structuredClone(draft ?? {});
  out.lang = out.lang || language;
  out.hosting = { ...builderHosting(slug, cardDomain), ...(out.hosting || {}) };
  out.store = out.store || { mode: "shared" };
  out.package = out.package || "signature";
  out.meta = { ...metaFor(out, language), ...(out.meta || {}) };
  out.calendarDescription = out.calendarDescription || calendarTextFor(out, language);
  return out;
}
