import { publishEvent, referencedFiles } from "../src/lib/publish.js";
import { sampleFor } from "../src/lib/sample";
import { effectiveFeatures } from "../src/lib/draft-status";
import { validateEvent } from "../src/lib/validate";
let fails = 0;
const check = (name: string, ok: boolean, extra = "") => { if (!ok) fails++; console.log(ok ? "PASS" : "FAIL", name, extra); };
const dina: any = { theme: "lover", lang: "ms", couple: { first: "bride", groom: { name: "Muhammad Farid", full: "bin Hj. Anuar", short: "Farid", parentsHtml: "Hj. Anuar" }, bride: { name: "Nur Dina", full: "binti Hj. Rashid", short: "Dina", parentsHtml: "Hj. Rashid" } },
  host: { parents: ["Hj. Rashid"] }, date: { start: "2027-05-15T11:00:00+08:00", end: "2027-05-15T16:00:00+08:00" },
  venue: { name: "Dewan Anggerik", area: "Kuantan, Pahang", address: "Jalan Contoh, Kuantan", maps: "https://maps.google.com/?q=a", waze: "https://waze.com/ul?q=a" },
  aturcara: [{ icon: "jam", label: "Ketibaan", time: "11:00 AM" }], meta: { ogImage: "cover/og-preview.jpg" }, portraits: { groom: "portrait/groom.webp", bride: "portrait/bride.webp" },
  gallery: [{ src: "gallery/1.webp", width: 1200, height: 800, alt: "Gambar 1" }], features: { music: false, dressCode: false, gifts: true, duitnow: false }, gifts: { items: [{ id: "g1", name: "Mesin kopi", note: "", price: "RM 350", url: "https://shopee.com.my/x" }] } };

const make = (d: any, tier: any = "full", slug = "dina-farid") => publishEvent(d, sampleFor("lover", "ms"), { slug, features: effectiveFeatures(d, tier) });
const event = make(dina);
check("a real card is not a preview and keeps guests' answers", event.preview === undefined && event.store.mode === "cloudflare" && event.store.api === undefined);
check("it is served at the card domain, under its own address", event.hosting.base === "/dina-farid/" && /^kad\./.test(event.hosting.domain));
check("it validates", validateEvent(event).ok, JSON.stringify((validateEvent(event) as any).problems?.slice(0, 2) ?? ""));
const text = JSON.stringify(event);
check("no sample person or photo comes along", !["Aisyah", "Hafiz", "Rohani", "012-345"].some((w) => text.includes(w)));
check("the customer's gallery is exactly theirs (one photo, not the sample's)", event.gallery.length === 1 && event.gallery[0].src === "gallery/1.webp");
check("the files it needs are listed", referencedFiles(event).sort().join() === "cover/og-preview.jpg,gallery/1.webp,gifts/g1.webp,portrait/bride.webp,portrait/groom.webp");
const basic = make(dina, "basic");
check("a switch outside the package is off, so its files are not needed", basic.features.gifts === false && !referencedFiles(basic).includes("gifts/g1.webp"));
const noGallery = make({ ...dina, gallery: undefined });
check("with no gallery uploaded none is invented from the sample", !noGallery.gallery || noGallery.gallery.length === 0);
let bad = ""; try { make(dina, "full", "Bad Slug"); } catch (e: any) { bad = e.message; }
check("a bad address is refused", /not a valid address/.test(bad));
console.log(fails ? `${fails} FAILED` : "all passed");
if (fails) process.exit(1);
