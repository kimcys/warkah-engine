// Lover: soft pink, sky blue and butter-yellow pastel card. One page per screen (like every theme), a frosted-glass panel
// floating over four pastel scenes. Section order, scenes and the ambience settings live here.
import Opening from "./Opening.astro";
import Backdrop from "./Backdrop.astro";
import { defineTheme } from "../define";
import Hero from "./sections/Hero.astro";
import Invitation from "./sections/Invitation.astro";
import Details from "./sections/Details.astro";
import Countdown from "./sections/Countdown.astro";
import Programme from "./sections/Programme.astro";

export default defineTheme("lover", {
  name: "Lover",
  Opening,
  Backdrop,
  layout: "pages",
  themeColor: "#ffd7e9",
  fonts:
    "https://fonts.googleapis.com/css2?family=Allura&family=Cormorant+Garamond:wght@500;600;700&family=Montserrat:wght@300;400;600;800&family=Noto+Naskh+Arabic:wght@400;700&family=Satisfy&display=swap",
  preload: ["bg/lover-background.webp"],
  stylesheet: "style.css",

  // Pages this theme draws itself (the card page uses these instead of the shared ones).
  components: { hero: Hero, invitation: Invitation, details: Details, countdown: Countdown, programme: Programme },

  // Same walk as the other themes: one page per screen, scene (bloom pink, sky blue, butter yellow, rose) behind each page.
  sections: [
    { id: "hero", scene: "bloom" },
    { id: "invitation", scene: "bloom" },
    { id: "venueSign", scene: "butter", reveal: "zoom" },
    { id: "ayat", scene: "sky", reveal: "zoom" },
    { id: "mempelaiGroom", scene: "sky", reveal: "right" },
    { id: "mempelaiBride", scene: "bloom", reveal: "left" },
    { id: "details", scene: "butter" },
    { id: "countdown", scene: "rose", reveal: "zoom" },
    { id: "portraits", scene: "sky", reveal: "zoom" },
    { id: "gallery", scene: "bloom", reveal: "left" },
    { id: "programme", scene: "butter", reveal: "right" },
    { id: "dressCode", scene: "sky", reveal: "zoom" },
    { id: "doa", scene: "rose", reveal: "zoom" },
    { id: "rsvp", scene: "bloom" },
    { id: "wishes", scene: "sky", reveal: "left" },
    { id: "gifts", scene: "butter", reveal: "zoom" },
    { id: "thanks", scene: "rose" }
  ],


  // Groom and bride figures from models/library.json (a client can pick others in couple.model)
  defaultModels: { groom: "groom-3", bride: "bride-4" },

  classicSwatch: ["#df6093", "#bfe8f5", "#ffd8e9"],

  // Colour options (event.json "palette"). The pastel artwork is hue-shifted with the colours.
  palettes: {
    lilac: {
      label: "Ungu Lembut", swatch: ["#8f6cd6", "#cfe3f7", "#e6dcfb"],
      vars: { "--rose": "#8f6cd6", "--rose-deep": "#6e4bb8", "--rose-soft": "#e6dcfb", "--sky": "#cfe3f7", "--butter": "#f8eeb8", "--line": "rgba(110, 75, 184, 0.34)", "--shadow": "0 26px 86px rgba(110, 75, 184, 0.22)" },
      tint: { hue: -60 }, themeColor: "#e6dcfb", petals: ["#8f6cd6", "#b79df0", "#9fd0e8", "#f2e08a"]
    },
    peach: {
      label: "Pic Manis", swatch: ["#e0875a", "#ffe0cf", "#ffd0a8"],
      vars: { "--rose": "#e0875a", "--rose-deep": "#c2663a", "--rose-soft": "#ffe0cf", "--line": "rgba(194, 102, 58, 0.34)", "--shadow": "0 26px 86px rgba(194, 102, 58, 0.22)" },
      tint: { hue: 35, brightness: 1.02 }, themeColor: "#ffe0cf", petals: ["#e0875a", "#f0a77f", "#f6c9a3", "#f2cf63"]
    },
    mint: {
      label: "Pudina", swatch: ["#3fa38a", "#d3f2e8", "#bfe8d8"],
      vars: { "--rose": "#3fa38a", "--rose-deep": "#2a8470", "--rose-soft": "#d3f2e8", "--line": "rgba(42, 132, 112, 0.34)", "--shadow": "0 26px 86px rgba(42, 132, 112, 0.22)" },
      tint: { hue: 150, saturate: 0.9, brightness: 1.02 }, themeColor: "#d3f2e8", petals: ["#3fa38a", "#7fcab4", "#f0b6cc", "#f2e08a"]
    }
  },

  // Read by public/core/card.js
  client: {
    fairyLights: 16,
    petals: ["#df6093", "#ef8ab3", "#8fd0e8", "#f2cf63"],
    openingDelay: 150
  }
});
