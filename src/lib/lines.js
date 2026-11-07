// The form shows a name or the parents as plain lines; the card stores them as small HTML ("Hj. A bin B<br>&amp; Hjh. C binti D").
// These convert both ways. Plain JavaScript (see sample-merge.js for why).

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
export const escapeHtml = (text) => String(text).replace(/[&<>]/g, (c) => ESCAPES[c]);

const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", mdash: "—", ndash: "–" };
export function decodeEntities(text) {
  return String(text).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body) => {
    if (body[0] === "#") {
      const code = body[1].toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : whole;
    }
    return NAMED[body.toLowerCase()] ?? whole;
  });
}

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Lines from a textarea string or an array: control characters removed, each line trimmed, blank lines dropped. */
export function cleanLines(input) {
  const list = Array.isArray(input) ? input : String(input ?? "").split(/\r?\n/);
  return list.map((line) => String(line).replace(CONTROL, "").replace(/\s+/g, " ").trim()).filter(Boolean);
}

/** ["Hj. A bin B", "& Hjh. C binti D"]  ->  "Hj. A bin B<br>&amp; Hjh. C binti D" */
export const linesToHtml = (input) => cleanLines(input).map(escapeHtml).join("<br>");

/** "Hj. A bin B<br>&amp; Hjh. C binti D"  ->  ["Hj. A bin B", "& Hjh. C binti D"] (other tags are dropped, entities decoded) */
export function htmlToLines(html) {
  return cleanLines(String(html ?? "").split(/<br\s*\/?>/i).map((part) => decodeEntities(part.replace(/<[^>]*>/g, ""))));
}

// Which stored fields hold lines as HTML, and which hold a plain list of lines (host.parents). Used by readLines / writeLines.
export const LINES_AS_HTML = ["couple.groom.parentsHtml", "couple.bride.parentsHtml"];
export const LINES_AS_LIST = ["host.parents"];
