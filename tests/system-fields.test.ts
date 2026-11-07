import { completeDraft, builderHosting, metaFor, CARD_DOMAIN } from "../src/lib/system-fields.js";
import { isValidSlug, slugProblem, suggestSlug, RESERVED_SLUGS } from "../src/lib/slug.js";
import { sampleFor } from "../src/lib/sample";
import { validateEvent } from "../src/lib/validate";
import { eventSchema } from "../src/lib/event-schema";

let fails = 0;
const check = (name: string, ok: boolean, extra = "") => { if (!ok) fails++; console.log(ok ? "PASS" : "FAIL", name, extra); };

// --- slugs
check("a normal slug is valid", isValidSlug("aisyah-hafiz") && isValidSlug("a1b") && isValidSlug("nadiah-ezzan-2027"));
check("too short / long / bad characters / dashes at the ends", !isValidSlug("ab") && !isValidSlug("a".repeat(41)) && !isValidSlug("Aisyah") && !isValidSlug("ai syah") && !isValidSlug("-aisyah") && !isValidSlug("aisyah-"));
check("reserved words are refused", ["api", "admin", "catalogue", "models", "kad", "demo"].every((s) => !isValidSlug(s)) && RESERVED_SLUGS.length > 20);
check("the sample- prefix is refused (generated sample folders)", !isValidSlug("sample-lover-ms"));
check("problems are in Malay", /dikhaskan/.test(slugProblem("admin") ?? "") && /sekurang-kurangnya 3/.test(slugProblem("ab") ?? ""));
check("suggestion from the names, in card order", suggestSlug("Aisyah", "Hafiz") === "aisyah-hafiz");
check("suggestion drops accents and symbols", suggestSlug("Nur Aisyah", "Müller & Co") === "nur-aisyah-muller-co");
check("suggestion avoids taken ones", suggestSlug("Aisyah", "Hafiz", ["aisyah-hafiz", "aisyah-hafiz-2"]) === "aisyah-hafiz-3");
check("suggestion is always valid", isValidSlug(suggestSlug("A", "B")) && isValidSlug(suggestSlug("", "")) && isValidSlug(suggestSlug("x".repeat(60), "y".repeat(60))));

// --- system fields
const full: any = sampleFor("lover", "ms");
const { hosting, store, meta, package: pkg, calendarDescription, ...typed } = full;
check("a draft without system fields is NOT valid yet", !validateEvent(typed).ok);
const done = completeDraft(typed, { slug: "aisyah-hafiz", lang: "ms" });
check("completed draft validates", validateEvent(done).ok, JSON.stringify((validateEvent(done) as any).problems?.slice(0, 2) ?? ""));
check("hosting: <card domain>/<slug>/, no Firebase site", done.hosting.domain === CARD_DOMAIN && done.hosting.base === "/aisyah-hafiz/" && done.hosting.site === undefined);
check("no venue QR images are promised (they do not exist yet)", done.venue.qrMaps === "" && done.venue.qrWaze === "" && completeDraft({ ...typed, venue: { ...typed.venue, qrMaps: "qr/x.png" } }, { slug: "a-b-c" }).venue.qrMaps === "qr/x.png");
check("store is shared", done.store.mode === "shared");
check("Malay meta from the names, date and venue", done.meta.title === "Majlis Perkahwinan Aisyah & Hafiz" && /Sabtu 20 Mac 2027/.test(done.meta.description) && /Dewan Seri Kenanga/.test(done.meta.ogAlt + done.meta.description));
const en = completeDraft(typed, { slug: "aisyah-hafiz", lang: "en" });
check("English meta", en.meta.title === "Wedding of Aisyah & Hafiz" && /Saturday 20 March 2027/.test(en.meta.description));
const groomFirst = metaFor({ ...typed, couple: { ...typed.couple, first: "groom" } }, "ms");
check("meta follows who is first", groomFirst.title === "Majlis Perkahwinan Hafiz & Aisyah");
check("calendar text from the customer's own details", /Aisyah/.test(done.calendarDescription) && /Dewan Seri Kenanga/.test(done.calendarDescription) && /Sabtu 20 Mac 2027/.test(done.calendarDescription));
check("the customer's own meta is kept", completeDraft({ ...typed, meta: { title: "Kad Kami" } }, { slug: "x-y-z" }).meta.title === "Kad Kami");
check("no meta until names, date and venue exist", Object.keys(metaFor({}, "ms")).length === 0);
check("does not change the draft it is given", (typed as any).hosting === undefined);

// --- schema: where a card lives
const noHost: any = structuredClone(done); delete noHost.hosting.domain;
const r = validateEvent(noHost);
check("a card with neither site nor domain is refused", !r.ok);
const siteOnly: any = structuredClone(done); delete siteOnly.hosting.domain; siteOnly.hosting.site = "aisyahhafiz";
check("an old-style card with only a site is still fine", validateEvent(siteOnly).ok);
check("builderHosting", JSON.stringify(builderHosting("a-b-c")) === JSON.stringify({ domain: CARD_DOMAIN, base: "/a-b-c/" }));
check("the card domain is kad.aimanhakimcy.com for now", CARD_DOMAIN === "kad.aimanhakimcy.com");
check("a different domain can be given (the later move)", completeDraft(typed, { slug: "a-b-c", cardDomain: "kad.warkah.com.my" }).hosting.domain === "kad.warkah.com.my");
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
