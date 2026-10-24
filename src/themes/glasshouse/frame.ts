// Every page shows a frame from the concept video (576 x 1024, public/bg/) with background-size: cover.
// Text that must sit on something in the frame (the acrylic sign, the lamp-post board, the haze beside the
// couple) is drawn in an SVG with the same box and preserveAspectRatio "slice", so it lands on the same pixels
// on any phone.
export const FW = 576;
export const FH = 1024;
export const frameBox = { viewBox: `0 0 ${FW} ${FH}`, preserveAspectRatio: "xMidYMid slice" };

/** HTML wording from event.json as plain text lines (<br> = new line). */
export function plainLines(html: string) {
  return html
    .split(/<br\s*\/?>/i)
    .map((line) =>
      line
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&").replace(/&rsquo;/g, "’").replace(/&lsquo;/g, "‘")
        .replace(/&rdquo;/g, "”").replace(/&ldquo;/g, "“").replace(/&hellip;/g, "…").replace(/&nbsp;/g, " ")
        .trim()
    )
    .filter(Boolean);
}

/** Greedy word wrap for SVG text. */
export function wrap(text: string, max: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && (line + " " + word).length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Fit a word into a width (Libre Baskerville capitals average ~0.82em wide, plus letter-spacing). */
export const fitSize = (word: string, width: number, max: number) => Math.min(max, Math.round(width / (word.length * 0.84)));
