// npm run deploy -- <client>
// Builds the card, then uploads dist/<client>/ to its Firebase Hosting site (<site>.web.app).
// Needs the Firebase CLI: npm install -g firebase-tools && firebase login
import { writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { ROOT, fail, readEvent, readWarkahConfig, run } from "./lib.mjs";

const slug = process.argv[2];
const event = readEvent(slug);
const warkah = readWarkahConfig();
const site = event.hosting?.site;
const project = event.hosting?.project || warkah.firebaseProject;

if (!site) fail(`Set hosting.site in events/${slug}/event.json.`);
if (event.hosting?.base && event.hosting.base !== "/") {
  fail(`${slug} lives under ${event.hosting.base} of another site (a catalogue demo).\nBuild it with  npm run build -- ${slug}  and copy dist/${slug}/ into that site's folder ${event.hosting.base}`);
}

await run("node", [join("scripts", "run.mjs"), "build", slug]);

// One-off Firebase config pointing at this card's folder and site.
const configFile = join(ROOT, ".firebase.deploy.json");
const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
// Photos, song, QR codes and theme art keep their file names when replaced, so browsers recheck them hourly
// (a placeholder swapped for the real photo shows up after the next deploy). css/js carry ?v=<build> instead.
const hourly = [{ key: "Cache-Control", value: "public, max-age=3600, must-revalidate" }];
const noCache = [{ key: "Cache-Control", value: "no-cache" }];
writeFileSync(configFile, JSON.stringify({
  hosting: {
    site,
    public: `dist/${slug}`,
    ignore: ["**/.*"],
    cleanUrls: true,
    trailingSlash: false,
    headers: [
      { source: "/theme/**", headers: hourly },
      { source: "/event/**", headers: hourly },
      { source: "/warkah/**", headers: immutable },
      { source: "**/*.@(css|js)", headers: immutable },
      { source: "**/*.html", headers: noCache },
      { source: "/", headers: noCache }
    ]
  }
}, null, 2));

console.log(`\n▶ Deploying ${slug} → https://${site}.web.app  (project ${project})\n`);
try {
  await run("firebase", ["deploy", "--only", "hosting", "--config", ".firebase.deploy.json", "--project", project]);
  console.log(`\n✔ Live: https://${site}.web.app\n`);
} catch (error) {
  fail(`${error.message}\nIs the Firebase CLI installed and logged in?  npm install -g firebase-tools  then  firebase login\nDoes the site exist?  firebase hosting:sites:create ${site} --project ${project}`);
} finally {
  rmSync(configFile, { force: true });
}
