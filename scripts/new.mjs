// npm run new -- <client> [--from demo-royal-gold]
// Creates events/<client>/ from a starting card (default: the Royal Gold demo).
// Then: edit events/<client>/event.json, put photos / song / QR in events/<client>/assets/.
import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { EVENTS_DIR, fail, listEvents } from "./lib.mjs";

const args = process.argv.slice(2);
const slug = args.find((arg) => !arg.startsWith("--") && args[args.indexOf(arg) - 1] !== "--from");
const fromIndex = args.indexOf("--from");
const from = fromIndex >= 0 ? args[fromIndex + 1] : "demo-royal-gold";

if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) fail("Use: npm run new -- aiman-alyana [--from demo-royal-gold]  (lowercase, dashes)");
if (existsSync(join(EVENTS_DIR, slug))) fail(`events/${slug} already exists.`);
if (!existsSync(join(EVENTS_DIR, from, "event.json"))) fail(`Starting card "${from}" not found. Clients: ${listEvents().join(", ")}`);

cpSync(join(EVENTS_DIR, from), join(EVENTS_DIR, slug), {
  recursive: true,
  filter: (source) => !source.endsWith(".DS_Store")
});

const file = join(EVENTS_DIR, slug, "event.json");
const event = JSON.parse(readFileSync(file, "utf8"));
event.hosting = { site: slug.replace(/-/g, "") };   // aiman-alyana → aimanalyana.web.app (change if taken)
event.store = { mode: "shared" };
event.package = event.package || "signature";
if (from.startsWith("demo-")) {
  // Demos hide photos and QR codes; a real client card shows them.
  delete event.features?.portraits;
  delete event.features?.gallery;
  delete event.venue?.qrMaps;
  delete event.venue?.qrWaze;
  delete event.meta?.ogImage;
  event.gallery = [{ src: "gallery/1.webp", width: 1280, height: 720, alt: "Gambar pengantin" }];
}
writeFileSync(file, `${JSON.stringify(event, null, 2)}\n`);

console.log(`
✔ Created events/${slug}/ (copied from ${from})

Next:
  1. Edit events/${slug}/event.json  (names, date, venue, aturcara, contacts, features)
  2. Put the client's files in events/${slug}/assets/
       gallery/1.webp …   portrait/groom.webp, bride.webp   audio/song.m4a
       qr/google-maps.png, qr/waze.png   cover/og-preview.jpg (WhatsApp preview)
  3. Preview:   npm run dev -- ${slug}
  4. In the Firebase console (project warkah-kad), create document  events/${slug}
     with  owners: ["couple@gmail.com"]   so RSVPs can be saved and the couple can open /admin
  5. Create the site once:  firebase hosting:sites:create ${event.hosting.site}
  6. Go live:   npm run deploy -- ${slug}
`);
