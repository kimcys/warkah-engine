// Each build renders ONE client card. scripts/run.mjs sets these before calling Astro:
//   EVENT          the client folder name in events/ (e.g. "ezzan-nadiah")
//   WARKAH_PUBLIC  a staged public folder: shared files + the theme's files (/theme) + the client's files (/event)
//   WARKAH_OUT     where the finished site goes (dist/<event>)
// Run cards through `npm run dev -- <event>` / `npm run build -- <event>`, not `astro` directly.
import { defineConfig } from "astro/config";

export default defineConfig({
  publicDir: process.env.WARKAH_PUBLIC || "./public",
  outDir: process.env.WARKAH_OUT || "./dist/_unnamed",
  build: { format: "directory", inlineStylesheets: "never" },
  trailingSlash: "ignore",
  devToolbar: { enabled: false },
  server: { host: true }
});
