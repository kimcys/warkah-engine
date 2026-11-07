// The builder form, as data: six steps, each with the event.json fields the customer fills in (Malay labels). The builder renders from this,
// validate.ts takes its field names from it, and the catalogue publishes it. Fields not listed here are filled in by the system
// (hosting, store, meta, package) or take the schema's default wording (text.*).
//
//  kind: text | longtext | lines (one per line) | datetime | url | number | select | image | images | list | theme | palette | model | song | toggle
//  feature: the field only appears when that switch (features.ts) is ticked.

export interface BuilderField {
  path: string;                 // dotted path into event.json ("couple.groom.name")
  label: string;
  kind: "text" | "longtext" | "lines" | "datetime" | "url" | "number" | "select" | "image" | "images" | "list" | "theme" | "palette" | "model" | "song" | "toggle";
  required?: boolean;
  help?: string;
  feature?: string;
  options?: { value: string; label: string }[];
  asset?: string;               // key in asset-rules.ts
}

export interface BuilderStep {
  id: string;
  title: string;                // Malay
  fields: BuilderField[];
}

const person = (who: "groom" | "bride", noun: string): BuilderField[] => [
  { path: `couple.${who}.name`, label: `Nama panggilan ${noun}`, kind: "text", required: true, help: "Seperti dalam kad, contoh: Muhammad Ezzan" },
  { path: `couple.${who}.full`, label: `Nama penuh ${noun} (bin / binti)`, kind: "text", required: true },
  { path: `couple.${who}.short`, label: `Nama pendek ${noun}`, kind: "text", required: true, help: "Dipaparkan di halaman utama, contoh: Ezzan" },
  { path: `couple.${who}.parentsHtml`, label: `Ibu bapa ${noun}`, kind: "lines", required: true, help: "Satu baris untuk setiap ibu atau bapa" }
];

export const BUILDER_STEPS: BuilderStep[] = [
  {
    id: "pasangan", title: "Pasangan",
    fields: [
      ...person("groom", "pengantin lelaki"),
      ...person("bride", "pengantin perempuan"),
      { path: "couple.first", label: "Nama siapa dahulu", kind: "select", options: [{ value: "groom", label: "Pengantin lelaki" }, { value: "bride", label: "Pengantin perempuan" }] },
      { path: "couple.hashtag", label: "Hashtag (pilihan)", kind: "text" },
      { path: "host.parents", label: "Yang menjemput", kind: "lines", required: true, help: "Satu atau dua baris, contoh: Hj. Ahmad bin Hasan" }
    ]
  },
  {
    id: "majlis", title: "Majlis",
    fields: [
      { path: "date.start", label: "Mula", kind: "datetime", required: true },
      { path: "date.end", label: "Tamat", kind: "datetime", required: true },
      { path: "venue.name", label: "Nama tempat", kind: "text", required: true },
      { path: "venue.area", label: "Kawasan", kind: "text", required: true, help: "Contoh: Seri Kembangan, Selangor" },
      { path: "venue.address", label: "Alamat penuh", kind: "longtext", required: true },
      { path: "venue.maps", label: "Pautan Google Maps", kind: "url", required: true },
      { path: "venue.waze", label: "Pautan Waze", kind: "url", required: true },
      { path: "aturcara", label: "Atur cara majlis", kind: "list", required: true, feature: "programme", help: "Ikon, nama acara dan masa" },
      { path: "contacts", label: "Untuk dihubungi", kind: "list", help: "Nama, hubungan dan nombor telefon" },
      { path: "rsvp.maxGuests", label: "Bilangan tetamu maksimum bagi satu RSVP", kind: "number", feature: "rsvp" }
    ]
  },
  {
    id: "gaya", title: "Gaya",
    fields: [
      { path: "theme", label: "Tema", kind: "theme", required: true },
      { path: "palette", label: "Warna", kind: "palette" },
      { path: "couple.model.groom", label: "Model pengantin lelaki", kind: "model", feature: "mempelai" },
      { path: "couple.model.bride", label: "Model pengantin perempuan", kind: "model", feature: "mempelai" },
      { path: "couple.outfit.groom", label: "Warna pakaian pengantin lelaki", kind: "outfit", feature: "mempelai", help: "Pilihan. Tanpa pilihan, pakaian kekal seperti dalam gambar model." },
      { path: "couple.outfit.bride", label: "Warna pakaian pengantin perempuan", kind: "outfit", feature: "mempelai", help: "Pilihan. Tanpa pilihan, pakaian kekal seperti dalam gambar model." },
      { path: "music.src", label: "Lagu latar", kind: "song", feature: "music", asset: "music" },
      { path: "music.title", label: "Tajuk lagu", kind: "text", feature: "music" },
      { path: "music.artist", label: "Artis", kind: "text", feature: "music" }
    ]
  },
  {
    id: "gambar", title: "Gambar",
    fields: [
      { path: "meta.ogImage", label: "Gambar pratonton (bila pautan dikongsi)", kind: "image", required: true, asset: "cover" },
      { path: "portraits", label: "Potret pengantin", kind: "images", feature: "portraits", asset: "portrait" },
      { path: "gallery", label: "Galeri", kind: "images", feature: "gallery", asset: "gallery" }
    ]
  },
  {
    id: "tambahan", title: "Tambahan",
    fields: [
      { path: "features", label: "Pilih ciri yang anda mahu", kind: "toggle", help: "Ciri yang tidak dipilih tidak akan ada dalam kad." },
      { path: "ayat.ref", label: "Rujukan ayat", kind: "text", feature: "ayat" },
      { path: "ayat.arabic", label: "Ayat (Arab)", kind: "longtext", feature: "ayat" },
      { path: "ayat.malay", label: "Terjemahan", kind: "longtext", feature: "ayat" },
      { path: "gifts.items", label: "Senarai hadiah", kind: "list", feature: "gifts", asset: "gift", help: "Nama, harga anggaran, gambar dan pautan kedai" },
      { path: "duitnow.image", label: "Kod QR DuitNow", kind: "image", feature: "duitnow", asset: "qr" },
      { path: "duitnow.accountName", label: "Nama akaun DuitNow", kind: "text", feature: "duitnow" },
      { path: "dressCode.colors", label: "Tema warna / pakaian", kind: "list", feature: "dressCode" },
      { path: "dressCode.note", label: "Catatan (pilihan)", kind: "text", feature: "dressCode" }
    ]
  },
  {
    id: "terbit", title: "Semak & terbit",
    fields: []   // no inputs: completeness list, phone preview, price, pay, publish
  }
];

/** Malay label for a field path ("couple.groom.name" → "Nama panggilan pengantin lelaki"); longest matching prefix wins. */
export function labelFor(path: string): string | undefined {
  const all = BUILDER_STEPS.flatMap((s) => s.fields);
  const exact = all.find((f) => f.path === path);
  if (exact) return exact.label;
  const prefix = all.filter((f) => path.startsWith(f.path + ".")).sort((a, b) => b.path.length - a.path.length)[0];
  return prefix?.label;
}
