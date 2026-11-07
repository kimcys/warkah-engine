import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { linesToHtml, htmlToLines, cleanLines, escapeHtml } from "../src/lib/lines.js";
import { toIso, fromIso, addHours } from "../src/lib/datetime.js";
import { sanitizeDraft, safeHtml } from "../src/lib/sanitize.js";
import { checkUrl } from "../src/lib/urls.js";
import { imageInfo, fileKind } from "../src/lib/images.js";
import { getPath, setPath, hasValue } from "../src/lib/paths.js";

let fails = 0;
const check = (name: string, ok: boolean, extra = "") => { if (!ok) fails++; console.log(ok ? "PASS" : "FAIL", name, extra); };
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// ---------- lines <-> html
check("lines to html (the stored convention)", linesToHtml(["Hj. Ahmad bin Ali", "& Hjh. Zainab binti Omar"]) === "Hj. Ahmad bin Ali<br>&amp; Hjh. Zainab binti Omar");
check("html to lines", same(htmlToLines("Hj. Ahmad bin Ali<br>&amp; Hjh. Zainab binti Omar"), ["Hj. Ahmad bin Ali", "& Hjh. Zainab binti Omar"]));
check("round trip", same(htmlToLines(linesToHtml(["A & B", "C < D"])), ["A & B", "C < D"]));
check("a textarea string, blank lines and spaces", same(cleanLines("  Satu  \r\n\r\n Dua   tiga \n"), ["Satu", "Dua tiga"]));
check("markup typed by a customer is escaped, not kept", linesToHtml("<script>alert(1)</script>") === "&lt;script&gt;alert(1)&lt;/script&gt;");
check("entities decode (rsquo, ldquo, numeric)", same(htmlToLines("Dato&rsquo; Seri<br />&ldquo;x&rdquo; &#65;"), ["Dato’ Seri", "“x” A"]));
check("other tags are dropped when reading", same(htmlToLines("a<b>b</b><br>c"), ["ab", "c"]));
check("escapeHtml", escapeHtml("a&b<c>") === "a&amp;b&lt;c&gt;");

// ---------- paths
const o: any = {};
setPath(o, "couple.groom.name", "Ali"); setPath(o, "gallery.1.alt", "x");
check("setPath / getPath", getPath(o, "couple.groom.name") === "Ali" && Array.isArray(o.gallery) && getPath(o, "gallery.1.alt") === "x" && getPath(o, "a.b.c") === undefined);
check("hasValue", !hasValue("") && !hasValue("  ") && !hasValue([]) && !hasValue({}) && !hasValue(undefined) && hasValue("a") && hasValue(0) && hasValue(false) && hasValue([1]));

// ---------- date and time
check("toIso Malaysia", toIso("2027-03-20", "11:00") === "2027-03-20T11:00:00+08:00");
check("toIso other zone", toIso("2027-01-15", "09:30", "Europe/London") === "2027-01-15T09:30:00+00:00" && toIso("2027-07-15", "09:30", "Europe/London") === "2027-07-15T09:30:00+01:00");
check("toIso refuses nonsense", toIso("2027-02-30", "11:00") === null && toIso("2027-03-20", "25:00") === null && toIso("20/03/2027", "11:00") === null && toIso("2027-03-20", "11") === null);
check("fromIso", same(fromIso("2027-03-20T11:00:00+08:00"), { date: "2027-03-20", time: "11:00" }) && fromIso("nope") === null);
check("fromIso reads the wall clock of the zone", same(fromIso("2027-03-20T03:00:00Z"), { date: "2027-03-20", time: "11:00" }));
check("addHours (end = start + 5 h, across midnight)", addHours("2027-03-20T11:00:00+08:00", 5) === "2027-03-20T16:00:00+08:00" && addHours("2027-03-20T22:00:00+08:00", 5) === "2027-03-21T03:00:00+08:00");
check("round trip", same(fromIso(toIso("2027-12-31", "23:59")!), { date: "2027-12-31", time: "23:59" }));

// ---------- sanitiser
check("safeHtml keeps br / strong / em and entities", safeHtml("A<br>B <strong>x</strong> <em>y</em> &amp; &rsquo; &#169;") === "A<br>B <strong>x</strong> <em>y</em> &amp; &rsquo; &#169;");
check("safeHtml normalises tags and strips attributes", safeHtml("a<BR/>b<br class=x>c") === "a<br>b&lt;br class=x&gt;c");
const attack = safeHtml('<script>alert(1)</script><a href="x">y</a><img src=x onerror=alert(1)><svg onload=1><iframe src=x></iframe>');
check("safeHtml: no real tag survives, only escaped text", !/<(?!\/?(br|strong|em)>)/.test(attack) && !/>/.test(attack.replace(/<\/?(br|strong|em)>/g, "")), attack);
check("safeHtml escapes a lone & and >", safeHtml("a & b > c &copy;") === "a &amp; b &gt; c &amp;copy;");
const dirty: any = { couple: { groom: { name: "  Ali\u0000 ", parentsHtml: "A<br><script>x</script>& B" } }, text: { doaHtml: ["ok<br>", "<img onerror=1>"] }, venue: { name: "x".repeat(2500) } };
const { draft: clean, changes } = sanitizeDraft(dirty);
check("sanitizeDraft: trims, strips control characters", clean.couple.groom.name === "Ali");
check("sanitizeDraft: HTML fields are safe, lists too", !/<script/.test(clean.couple.groom.parentsHtml) && /&lt;script/.test(clean.couple.groom.parentsHtml) && !/<img/.test(clean.text.doaHtml[1]) && clean.text.doaHtml[0] === "ok<br>");
check("sanitizeDraft: long text is capped", clean.venue.name.length === 2000);
check("sanitizeDraft: reports what it changed", changes.length >= 4 && changes.some((c) => c.path === "couple.groom.parentsHtml"));
check("sanitizeDraft: copies, does not touch the input, adds no keys", dirty.venue.name.length === 2500 && JSON.stringify(Object.keys(clean)) === JSON.stringify(Object.keys(dirty)));

// ---------- urls
const ok = (kind: string, u: string) => checkUrl(kind, u).ok;
check("maps links", ok("maps", "https://maps.app.goo.gl/tZyrpMvgFTEzb8Xv7") && ok("maps", "https://www.google.com/maps/place/Dewan") && ok("maps", "https://maps.google.com/?q=a") && ok("maps", "https://www.google.com.my/maps?q=a") && ok("maps", "https://goo.gl/maps/abc"));
check("maps refuses other things", !ok("maps", "https://example.com/maps") && !ok("maps", "https://www.google.com/search?q=maps") && !ok("maps", "https://waze.com/ul?q=a") && !ok("maps", "https://goo.gl/abc"));
check("waze links", ok("waze", "https://waze.com/ul/hw282crcby") && ok("waze", "https://ul.waze.com/ul?q=a") && !ok("waze", "https://maps.google.com/?q=a"));
check("a missing scheme is added, http is upgraded", checkUrl("waze", "waze.com/ul?q=a").url === "https://waze.com/ul?q=a" && checkUrl("shop", "http://shopee.com.my/x").url === "https://shopee.com.my/x");
check("dangerous or odd links are refused", ["javascript:alert(1)", "data:text/html,x", "ftp://a.com/x", "https://user:pw@shopee.com.my/", "https://localhost/x", "https://192.168.1.1/x", "https://nodot/x", "", "   ", "https://" + "a".repeat(600) + ".com"].every((u) => !ok("shop", u)));
check("shop links: any https site", ok("shop", "https://shopee.com.my/product/1") && ok("shop", "https://www.lazada.com.my/x"));
check("problems are in Malay", /Google Maps/.test(checkUrl("maps", "https://example.com").problem!) && /https:\/\//.test(checkUrl("shop", "javascript:1").problem!));

// ---------- images and audio, read from real files
const root = process.cwd();
const read = (p: string) => new Uint8Array(readFileSync(join(root, p)));
const dims = (p: string) => { const i = imageInfo(read(p)); return i ? `${i.type}:${i.width}x${i.height}` : "null"; };
check("jpeg size", dims("samples/assets/modern/cover/og-preview.jpg") === "jpeg:720x1280");
check("png size", dims("samples/assets/modern/duitnow/qr.png") === "png:600x600" && dims("samples/assets/modern/qr/google-maps.png") === "png:400x400");
check("webp size (lossy)", dims("samples/assets/modern/gallery/1.webp") === "webp:1200x675" && dims("samples/assets/modern/gallery/2.webp") === "webp:750x1200" && dims("samples/assets/modern/gifts/g1.webp") === "webp:400x400");
const model = imageInfo(read("models/bride-4.webp"));
check("webp size (with transparency)", !!model && model.type === "webp" && model.width === 800 && model.height > 1000 && model.animated === false, JSON.stringify(model));
check("not images", imageInfo(new Uint8Array([1, 2, 3])) === null && imageInfo(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'></svg>")) === null && imageInfo(new Uint8Array(0)) === null);
check("a truncated image does not crash", imageInfo(read("samples/assets/modern/cover/og-preview.jpg").slice(0, 40)) === null);
check("fileKind of images", fileKind(read("samples/assets/modern/cover/og-preview.jpg")) === "jpeg" && fileKind(read("samples/assets/modern/duitnow/qr.png")) === "png" && fileKind(read("models/groom-1.webp")) === "webp");
check("fileKind refuses a renamed script", fileKind(new TextEncoder().encode("<?php echo 1; ?>")) === null && fileKind(new TextEncoder().encode("<svg></svg>")) === null);
const audio = join(root, "events/lover-demo/assets/audio");
if (existsSync(join(audio, "song.m4a"))) check("m4a audio", fileKind(read("events/lover-demo/assets/audio/song.m4a")) === "m4a");
if (existsSync(join(audio, "song.mp3"))) check("mp3 audio", fileKind(read("events/lover-demo/assets/audio/song.mp3")) === "mp3");

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
