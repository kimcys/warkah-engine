// Royal Gold: storybook opening on a candle-lit desk, then full-page scenes on a royal dais.
// Section order, which scene each section shows, and the ambience settings live here.
import Opening from "./Opening.astro";
import Backdrop from "./Backdrop.astro";
import { defineTheme } from "../define";

export default defineTheme("royal-gold", {
  name: "Royal Gold",
  Opening,
  Backdrop,
  layout: "pages",
  themeColor: "#f0b92a",
  fonts:
    "https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Cormorant+Garamond:wght@500;600;700&family=Great+Vibes&family=Nunito:wght@500;600;700&family=Libre+Baskerville:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&display=swap",
  preload: ["opening/desk.webp?v=3"],
  stylesheet: "style.css",

  // Page order + scene per page. data-pos / data-reveal tune where the panel sits and how it enters.
  sections: [
    { id: "hero", scene: "stage" },
    { id: "invitation", scene: "chandelier" },
    { id: "venueSign", scene: "chandelier", pos: "middle", reveal: "zoom" },
    { id: "ayat", scene: "stage", pos: "middle", reveal: "zoom" },
    { id: "mempelaiGroom", scene: "groom", pos: "middle", reveal: "right" },
    { id: "mempelaiBride", scene: "bride", pos: "middle", reveal: "left" },
    { id: "details", scene: "aisle", pos: "bottom" },
    { id: "countdown", scene: "chandelier", pos: "middle", reveal: "zoom" },
    { id: "programme", scene: "garden", reveal: "right" },
    { id: "dressCode", scene: "aisle", pos: "middle", reveal: "left" },
    { id: "portraits", scene: "chandelier", reveal: "zoom" },
    { id: "gallery", scene: "garden", reveal: "left" },
    { id: "doa", scene: "stage", pos: "top", reveal: "zoom" },
    { id: "rsvp", scene: "aisle", pos: "bottom" },
    { id: "wishes", scene: "garden", reveal: "left" },
    { id: "gifts", scene: "chandelier", pos: "middle", reveal: "zoom" },
    { id: "thanks", scene: "stage", pos: "top" }
  ],

  // Scenes with no one painted in, for when a client picks a groom/bride model (otherwise the painted couple scenes show)
  modelScenes: { groom: "garden", bride: "chandelier" },

  classicSwatch: ["#7a1424", "#c8901a", "#f7e3a1"],

  // Colour options (event.json "palette"). The artwork is hue-shifted, so these change the whole card, opening included.
  palettes: {
    "rose-gold": {
      label: "Emas Jambu", swatch: ["#8a3b4f", "#b9794f", "#f3d8c4"],
      vars: { "--maroon": "#8a3b4f", "--maroon-deep": "#5d2433", "--maroon-soft": "#b4586d", "--gold": "#b9794f", "--gold-deep": "#7d4a2c", "--gold-bright": "#e9b48e", "--gold-soft": "#f3d8c4", "--cream": "#fff4ec", "--ink": "#4f2a30", "--muted": "#6b4a4a" },
      tint: { hue: -20, saturate: 0.7, brightness: 1.05 }, themeColor: "#f3d8c4"
    },
    ivory: {
      label: "Gading", swatch: ["#5a4636", "#a88b5a", "#f2e6c8"],
      vars: { "--maroon": "#5a4636", "--maroon-deep": "#3a2c21", "--maroon-soft": "#7d6652", "--gold": "#a88b5a", "--gold-deep": "#6e5a35", "--gold-bright": "#e6cf9a", "--gold-soft": "#f2e6c8", "--ink": "#3a2f26", "--muted": "#6a5a4a" },
      tint: { hue: -8, saturate: 0.35, brightness: 1.06 }, themeColor: "#f2e6c8"
    },
    navy: {
      label: "Biru Diraja", swatch: ["#1c3a78", "#c8901a", "#cfdcf3"],
      vars: { "--maroon": "#1c3a78", "--maroon-deep": "#0f2352", "--maroon-soft": "#2f58a6", "--ink": "#17294f", "--muted": "#3b4f78", "--shadow": "0 26px 86px rgba(15, 35, 82, 0.34)" },
      tint: { hue: 170, saturate: 0.55, brightness: 0.95 }, themeColor: "#cfdcf3"
    }
  },

  // Read by public/core/card.js
  client: {
    fairyLights: 22,
    petals: ["#8f1a2c", "#a3283b", "#6f1020", "#c23a4e", "#b8860b"],
    openingDelay: 250,
    wishesPerPage: 2   // ucapan shown per page in the wishes list
  }
});
