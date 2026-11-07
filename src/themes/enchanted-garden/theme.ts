// Enchanted Garden: the original Nadiah & Ezzan card, as a theme. A gold mirror floating in the sky opens onto a
// garden poster, then full-page scenes (arch, garden, sky) fade behind a floating frosted panel.
import Opening from "./Opening.astro";
import Backdrop from "./Backdrop.astro";
import { defineTheme } from "../define";
import Hero from "./sections/Hero.astro";
import Invitation from "./sections/Invitation.astro";
import Details from "./sections/Details.astro";
import Countdown from "./sections/Countdown.astro";
import Programme from "./sections/Programme.astro";
import Thanks from "./sections/Thanks.astro";

export default defineTheme("enchanted-garden", {
  name: "Enchanted Garden",
  Opening,
  Backdrop,
  layout: "pages",
  themeColor: "#8fc6ec",
  fonts:
    "https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cormorant+Garamond:wght@500;600;700&family=Montserrat:wght@300;400;600;800&family=Noto+Naskh+Arabic:wght@400;700&display=swap",
  preload: ["opening/mirror.webp?v=2"],
  stylesheet: "style.css",

  components: { hero: Hero, invitation: Invitation, details: Details, countdown: Countdown, programme: Programme, thanks: Thanks },

  // Page order + the scene behind each page (garden = the base background, arch and sky are layers)
  sections: [
    { id: "hero", scene: "garden" },
    { id: "invitation", scene: "arch" },
    { id: "venueSign", scene: "garden", reveal: "zoom" },
    { id: "ayat", scene: "sky", reveal: "zoom" },
    { id: "mempelaiGroom", scene: "garden", reveal: "right" },
    { id: "mempelaiBride", scene: "arch", reveal: "left" },
    { id: "details", scene: "garden" },
    { id: "programme", scene: "garden", reveal: "right" },
    { id: "countdown", scene: "sky" },
    { id: "dressCode", scene: "arch", reveal: "left" },
    { id: "portraits", scene: "arch", reveal: "zoom" },
    { id: "gallery", scene: "garden", reveal: "left" },
    { id: "doa", scene: "sky", reveal: "zoom" },
    { id: "rsvp", scene: "garden" },
    { id: "wishes", scene: "arch", reveal: "left" },
    { id: "gifts", scene: "garden", reveal: "zoom" },
    { id: "thanks", scene: "garden" }
  ],

  // Groom and bride figures from models/library.json (a client can pick others in couple.model)
  defaultModels: { groom: "groom-3", bride: "bride-5" },

  // Colour options (event.json "palette"). Colours only: the garden artwork is painted, so it is not tinted.
  palettes: {
    lavender: {
      label: "Lavender", swatch: ["#8d7fb8", "#8566b8", "#e6e0f3"],
      vars: { "--sage": "#8d7fb8", "--sage-deep": "#62558f", "--sage-soft": "#e6e0f3", "--gold": "#8566b8", "--gold-deep": "#5f4590", "--gold-soft": "#d6c8ee", "--rose": "#b5779e", "--rose-deep": "#8f5a7d", "--sky-deep": "#7a8fd8", "--line": "rgba(133, 102, 184, 0.3)", "--shadow": "0 26px 86px rgba(80, 60, 130, 0.28)" },
      themeColor: "#e6e0f3", petals: ["#b79df0", "#c9b6f5", "#e5a8c9", "#f0d9f5"]
    },
    "dusty-rose": {
      label: "Mawar Kelabu", swatch: ["#b57f8a", "#b0687a", "#f1dde1"],
      vars: { "--sage": "#b57f8a", "--sage-deep": "#8a5560", "--sage-soft": "#f1dde1", "--gold": "#b0687a", "--gold-deep": "#85485a", "--gold-soft": "#edc9d2", "--line": "rgba(176, 104, 122, 0.3)", "--shadow": "0 26px 86px rgba(120, 60, 75, 0.26)" },
      themeColor: "#f1dde1"
    },
    ocean: {
      label: "Lautan", swatch: ["#5b8fa6", "#3f7f98", "#dcebf2"],
      vars: { "--sage": "#5b8fa6", "--sage-deep": "#3a6578", "--sage-soft": "#dcebf2", "--gold": "#3f7f98", "--gold-deep": "#2b5d73", "--gold-soft": "#bfdde9", "--line": "rgba(63, 127, 152, 0.3)", "--shadow": "0 26px 86px rgba(40, 90, 110, 0.26)" },
      themeColor: "#dcebf2", petals: ["#8fc6ec", "#b9dcf2", "#f2c9d3", "#e8f4fa"]
    }
  },

  // Read by public/core/card.js
  client: {
    fairyLights: 22,
    petals: ["#f0a9bb", "#f6c3cf", "#e994aa", "#fbe2e8", "#f3b6c4"],
    openingDelay: 650
  }
});
