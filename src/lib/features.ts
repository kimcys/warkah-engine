// The feature catalogue: everything a client can switch on or off in event.json "features". The schema (content.config.ts), the page
// list (sections.ts), THEMES.md and the future builder all read from here, so a new switch is added in one place.
//
//  group "page"   a page of the card (or the music player). Default on; switching it off removes it.
//  group "addon"  an extra the client opts into. Default off.
//
// Core pages (hero, invitation, details, thanks) and the Lokasi / Hubungi buttons are always there and have no switch.

export interface FeatureDef {
  key: string;
  group: "page" | "addon";
  default: boolean;
  label: string;          // shown to the customer (Malay)
  description: string;
  needs?: string;         // what the client must also provide (event.json data) for it to show
}

export const FEATURES: FeatureDef[] = [
  // pages
  { key: "mempelai", group: "page", default: true, label: "Pengantin lelaki & perempuan", description: "Satu halaman setiap pengantin, dengan model pilihan.", needs: "couple.model (pilihan)" },
  { key: "countdown", group: "page", default: true, label: "Kiraan detik", description: "Hari, jam, minit dan saat ke majlis." },
  { key: "programme", group: "page", default: true, label: "Atur cara majlis", description: "Jadual majlis.", needs: "aturcara" },
  { key: "portraits", group: "page", default: true, label: "Potret pengantin", description: "Gambar pengantin." },
  { key: "gallery", group: "page", default: true, label: "Galeri", description: "Galeri gambar.", needs: "gallery (sekurang-kurangnya satu gambar)" },
  { key: "dressCode", group: "page", default: true, label: "Tema warna / pakaian", description: "Warna pakaian yang dicadangkan.", needs: "dressCode" },
  { key: "doa", group: "page", default: true, label: "Doa untuk pengantin", description: "Halaman doa." },
  { key: "rsvp", group: "page", default: true, label: "RSVP", description: "Pengesahan kehadiran (halaman dan butang RSVP)." },
  { key: "wishes", group: "page", default: true, label: "Ucapan tetamu", description: "Ucapan daripada tetamu (dihantar melalui RSVP)." },
  { key: "music", group: "page", default: true, label: "Muzik latar", description: "Lagu dan butang Muzik.", needs: "music" },
  // add-ons
  { key: "ayat", group: "addon", default: false, label: "Ayat Al-Quran", description: "Halaman ayat (Ar-Rum 30:21 atau ayat pilihan).", needs: "ayat (pilihan)" },
  { key: "venueSign", group: "addon", default: false, label: "Papan tanda lokasi", description: "Nama tempat di halaman sendiri." },
  { key: "gifts", group: "addon", default: false, label: "Senarai hadiah", description: "Warkah Hadiah: tetamu pilih hadiah.", needs: "gifts.items" },
  { key: "duitnow", group: "addon", default: false, label: "DuitNow QR", description: "Sumbangan melalui DuitNow.", needs: "duitnow.image" },
  { key: "kenang", group: "addon", default: false, label: "Warkah Kenang", description: "Butang ke photobooth dan dinding kenangan." },
  { key: "guestName", group: "addon", default: false, label: "Nama tetamu dalam pautan", description: "?to=Nama (belum dijual)." }
];

export const FEATURE_KEYS = FEATURES.map((f) => f.key);
