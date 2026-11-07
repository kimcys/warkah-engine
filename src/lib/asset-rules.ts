// What the customer may upload for each kind of file. The builder checks these in the browser (and the API again), then shrinks images to
// WebP before upload so cards stay light. Numbers are what the current cards use (see events/*/assets).
export interface AssetRule {
  key: string;
  label: string;           // Malay, shown next to the upload box
  formats: string[];       // accepted types
  maxBytes: number;        // after the browser has shrunk it
  maxLongEdge?: number;    // px; larger images are scaled down
  minLongEdge?: number;    // px; smaller ones are refused (they would look blurry)
  max?: number;            // how many files
  hint: string;
}

const KB = 1024;
export const ASSET_RULES: AssetRule[] = [
  { key: "cover", label: "Gambar pratonton (WhatsApp)", formats: ["image/jpeg"], maxBytes: 300 * KB, maxLongEdge: 1280, minLongEdge: 720, max: 1, hint: "720 x 1280 (menegak). Ini yang muncul bila pautan dikongsi." },
  { key: "portrait", label: "Potret pengantin", formats: ["image/webp", "image/jpeg", "image/png"], maxBytes: 200 * KB, maxLongEdge: 1400, minLongEdge: 800, max: 2, hint: "Satu untuk setiap pengantin, menegak (kira-kira 4:5)." },
  { key: "gallery", label: "Galeri", formats: ["image/webp", "image/jpeg", "image/png"], maxBytes: 300 * KB, maxLongEdge: 1400, minLongEdge: 700, max: 12, hint: "Sehingga 12 gambar. Menegak atau melintang." },
  { key: "gift", label: "Gambar hadiah", formats: ["image/webp", "image/jpeg", "image/png"], maxBytes: 80 * KB, maxLongEdge: 600, minLongEdge: 300, max: 20, hint: "Persegi (kira-kira 400 x 400)." },
  { key: "qr", label: "Kod QR (DuitNow / peta)", formats: ["image/png", "image/webp"], maxBytes: 150 * KB, maxLongEdge: 800, minLongEdge: 300, max: 1, hint: "Persegi, latar putih, jelas untuk diimbas." },
  { key: "music", label: "Lagu latar", formats: ["audio/mpeg", "audio/mp4"], maxBytes: 6 * 1024 * KB, max: 1, hint: "MP3 atau M4A, kurang 6 MB (kira-kira 3 minit)." }
];
