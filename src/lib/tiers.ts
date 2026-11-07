// Package tiers. PRICES ARE PLACEHOLDERS (to be confirmed): basic RM39, full RM79, custom RM99. A tier decides which switches the customer
// may turn on in the builder; the card itself does not check it (event.json features stay the single source of truth for what shows).
export interface Tier {
  id: "basic" | "full" | "custom";
  label: string;
  priceRM: number;            // placeholder
  features: string[] | "all"; // switches the customer may tick (see features.ts); pages always on are not listed
  note: string;
}

export const TIERS: Tier[] = [
  { id: "basic", label: "Asas", priceRM: 39, features: ["mempelai", "countdown", "programme", "portraits", "gallery", "doa", "rsvp", "wishes", "music"], note: "Halaman utama, tema, warna dan model pengantin. PROPOSED split, to confirm." },
  { id: "full", label: "Penuh", priceRM: 79, features: "all", note: "Semua ciri dan tambahan: hadiah, DuitNow, ayat, papan tanda, tema pakaian." },
  { id: "custom", label: "Reka Khas", priceRM: 99, features: "all", note: "Reka bentuk tema khas untuk pasangan (dibuat oleh pasukan Warkah)." }
];
