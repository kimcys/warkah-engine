// What a file really is, read from its first bytes (never from its name), and the size of an image. Used by the upload route before anything is stored.
// Plain JavaScript on Uint8Array, so it runs in the Worker, the browser and Node.

const u16be = (b, i) => (b[i] << 8) | b[i + 1];
const u32be = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
const u16le = (b, i) => b[i] | (b[i + 1] << 8);
const ascii = (b, from, to) => String.fromCharCode(...b.slice(from, to));

/** { type: "png" | "jpeg" | "webp", width, height, animated } for an image, or null when the bytes are not a readable PNG, JPEG or WebP. */
export function imageInfo(bytes) {
  const b = bytes;
  if (b.length > 24 && b[0] === 0x89 && ascii(b, 1, 4) === "PNG" && ascii(b, 12, 16) === "IHDR") {
    const width = u32be(b, 16), height = u32be(b, 20);
    return width && height ? { type: "png", width, height, animated: false } : null;
  }
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker === 0xff) { i++; continue; }
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) { i += 2; continue; }
      const length = u16be(b, i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        const height = u16be(b, i + 5), width = u16be(b, i + 7);
        return width && height ? { type: "jpeg", width, height, animated: false } : null;
      }
      i += 2 + length;
    }
    return null;
  }
  if (b.length > 30 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") {
    const chunk = ascii(b, 12, 16);
    if (chunk === "VP8 " && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
      return { type: "webp", width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff, animated: false };
    }
    if (chunk === "VP8L" && b[20] === 0x2f) {
      const width = 1 + (((b[22] & 0x3f) << 8) | b[21]);
      const height = 1 + (((b[24] & 0x0f) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6));
      return { type: "webp", width, height, animated: false };
    }
    if (chunk === "VP8X") {
      const width = 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
      return { type: "webp", width, height, animated: (b[20] & 0x02) !== 0 };
    }
  }
  return null;
}

/** "png" | "jpeg" | "webp" | "mp3" | "m4a" | null, from the content. */
export function fileKind(bytes) {
  const image = imageInfo(bytes);
  if (image) return image.type;
  const b = bytes;
  if (b.length > 12 && ascii(b, 4, 8) === "ftyp") return "m4a";
  if (b.length > 3 && ascii(b, 0, 3) === "ID3") return "mp3";
  if (b.length > 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0 && (b[1] & 0x06) !== 0) return "mp3";
  return null;
}

export const MIME = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp", mp3: "audio/mpeg", m4a: "audio/mp4" };
