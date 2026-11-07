// Everything the customer writes passes through here before it is saved. Plain strings are escaped by the card when it draws them;
// the few fields the card draws as HTML (parents, a few text blocks) get only <br>, <strong>, <em> and a short list of entities. Plain JavaScript.

const MAX_TEXT = 2000;
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

// The fields the card renders with set:html.
const HTML_FIELDS = ["couple.groom.parentsHtml", "couple.bride.parentsHtml", "text.inviteHtml", "text.honorificsHtml", "text.qrLeadHtml", "text.doaLeadHtml", "text.rsvpDeadlineHtml"];
const HTML_LIST_FIELDS = ["text.doaHtml"];

const TAG = /^<(\/?)(br|strong|em)\s*\/?>/i;
const ENTITY = /^&(?:amp|lt|gt|quot|apos|nbsp|rsquo|lsquo|rdquo|ldquo|hellip|mdash|ndash|#\d{1,6}|#x[0-9a-f]{1,5});/i;

/** Keeps <br>, <strong>, <em> (no attributes) and known entities; escapes everything else that could be markup. */
export function safeHtml(input) {
  const s = String(input);
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "<") {
      const m = TAG.exec(s.slice(i, i + 12));
      if (m) {
        const name = m[2].toLowerCase();
        out += name === "br" ? "<br>" : `<${m[1]}${name}>`;
        i += m[0].length - 1;
      } else out += "&lt;";
    } else if (ch === "&") {
      const m = ENTITY.exec(s.slice(i, i + 12));
      if (m) { out += m[0]; i += m[0].length - 1; } else out += "&amp;";
    } else if (ch === ">") out += "&gt;";
    else out += ch;
  }
  return out;
}

/**
 * A cleaned copy of a draft plus a list of what was changed: control characters removed, text trimmed and capped at 2000 characters,
 * and the HTML fields reduced to the safe subset. Nothing is added; keys the draft does not have stay absent.
 */
export function sanitizeDraft(draft) {
  const changes = [];
  const note = (path, reason) => changes.push({ path, reason });
  const walk = (value, path) => {
    if (typeof value === "string") {
      let text = value.replace(CONTROL, "");
      if (text !== value) note(path, "aksara kawalan dibuang");
      text = text.trim();
      if (text.length > MAX_TEXT) { text = text.slice(0, MAX_TEXT); note(path, "dipotong kepada 2000 aksara"); }
      const isHtml = HTML_FIELDS.includes(path) || HTML_LIST_FIELDS.some((p) => path.startsWith(`${p}.`));
      if (isHtml) {
        const safe = safeHtml(text);
        if (safe !== text) note(path, "HTML dibersihkan");
        text = safe;
      }
      return text;
    }
    if (Array.isArray(value)) return value.map((item, i) => walk(item, path ? `${path}.${i}` : String(i)));
    if (value && typeof value === "object") {
      const out = {};
      for (const [key, inner] of Object.entries(value)) out[key] = walk(inner, path ? `${path}.${key}` : key);
      return out;
    }
    return value;
  };
  return { draft: walk(draft ?? {}, ""), changes };
}
