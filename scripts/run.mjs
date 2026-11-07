// npm run dev   -- <client>        preview one card at http://localhost:4321
// npm run build -- <client>        build one card into dist/<client>/
// npm run build:all                build every client in events/
import { join } from "node:path";
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { recolourStaged } from "./recolour-staged.mjs";
import { ROOT, fail, listEvents, readEvent, run, sizeOf, stage } from "./lib.mjs";

const [mode, ...rest] = process.argv.slice(2);
const all = rest.includes("--all");
const keepCatalogue = rest.includes("--catalogue");   // npm run catalogue
const slugs = all ? listEvents() : [rest.find((arg) => !arg.startsWith("--"))];

if (!["dev", "build"].includes(mode)) fail("Use: npm run dev -- <client>  or  npm run build -- <client>");

const astro = join(ROOT, "node_modules", ".bin", process.platform === "win32" ? "astro.cmd" : "astro");

for (const slug of slugs) {
  const event = readEvent(slug);
  const publicDir = stage(slug, event);
  await recolourStaged(event, publicDir);                // the customer's outfit colours, applied to the staged model pictures
  const outDir = join(ROOT, "dist", slug);
  const env = { EVENT: slug, WARKAH_PUBLIC: publicDir, WARKAH_OUT: outDir };

  if (mode === "dev") {
    console.log(`\n▶ ${slug} (${event.theme}). Changed photos or the theme folder? Stop and run this again.\n`);
    await run(astro, ["dev"], env);
  } else {
    console.log(`\n▶ Building ${slug} (${event.theme}) → dist/${slug}/`);
    await run(astro, ["build"], env).catch((error) => fail(error.message));
    // catalogue.json is the builder's list of choices (src/pages/catalogue.json.ts): kept by `npm run catalogue`, never shipped in a card
    const catalogueFile = join(outDir, "catalogue.json");
    if (keepCatalogue && existsSync(catalogueFile)) {
      mkdirSync(join(ROOT, "generated"), { recursive: true });
      copyFileSync(catalogueFile, join(ROOT, "generated", "catalogue.json"));
      console.log("✔ generated/catalogue.json");
    }
    rmSync(catalogueFile, { force: true });
    console.log(`✔ dist/${slug}/  (${(sizeOf(outDir) / 1024 / 1024).toFixed(1)} MB)`);
  }
}
