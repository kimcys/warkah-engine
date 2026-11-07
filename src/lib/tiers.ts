// Packages and add-ons. PRICES ARE PLACEHOLDERS (to be confirmed). A tier decides which switches the customer may turn on in the builder; the card
// itself does not check it (event.json features stay the single source of truth for what shows).
//
//   Asas       the core invitation
//   Penuh      everything, with both add-ons included
//   Reka Khas  Penuh, plus a theme designed for the couple by the Warkah team
//   Add-ons    the Gifts list and the DuitNow QR can be bought on their own, on top of Asas (a card keeps its add-ons in `cards.addons`)
export interface Tier {
  id: "basic" | "full" | "custom";
  label: string;
  priceRM: number;            // placeholder
  features: string[] | "all"; // switches the customer may tick (see features.ts); pages always on are not listed
  note: string;
}

export interface Addon {
  key: "gifts" | "duitnow";   // a switch in features.ts
  label: string;
  priceRM: number;            // placeholder
  note: string;
}

export const TIERS: Tier[] = [
  { id: "basic", label: "Asas", priceRM: 39, features: ["mempelai", "countdown", "programme", "rsvp", "wishes", "music"], note: "Kad jemputan asas: pengantin, kiraan detik, atur cara, RSVP, ucapan tetamu dan muzik." },
  { id: "full", label: "Penuh", priceRM: 79, features: "all", note: "Semua ciri: potret, galeri, doa, ayat, tema pakaian, papan tanda lokasi, serta senarai hadiah dan DuitNow." },
  { id: "custom", label: "Reka Khas", priceRM: 99, features: "all", note: "Semua dalam Penuh, dengan tema reka bentuk khas untuk pasangan (dibuat oleh pasukan Warkah)." }
];

/** Bought separately (or included in Penuh and Reka Khas). */
export const ADDONS: Addon[] = [
  { key: "gifts", label: "Senarai hadiah", priceRM: 15, note: "Senarai hadiah dengan gambar dan pautan kedai." },
  { key: "duitnow", label: "DuitNow QR", priceRM: 15, note: "Kod QR DuitNow untuk tetamu yang mahu memberi sumbangan." }
];
export const ADDON_KEYS = ADDONS.map((a) => a.key);
