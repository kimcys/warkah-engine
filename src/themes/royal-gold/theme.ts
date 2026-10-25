// Royal Gold: storybook opening on a candle-lit desk, then full-page scenes on a royal dais.
// Section order, which scene each section shows, and the ambience settings live here.
import Opening from "./Opening.astro";
import Backdrop from "./Backdrop.astro";

export default {
  name: "Royal Gold",
  Opening,
  Backdrop,
  bodyClass: "layout-pages",
  themeColor: "#f0b92a",
  fonts:
    "https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Cormorant+Garamond:wght@500;600;700&family=Great+Vibes&family=Nunito:wght@500;600;700&family=Libre+Baskerville:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&display=swap",
  preload: ["opening/desk.webp?v=3"],
  stylesheet: "style.css",

  // Page order + scene per page. data-pos / data-reveal tune where the panel sits and how it enters.
  sections: [
    { id: "hero", scene: "stage" },
    { id: "invitation", scene: "chandelier" },
    { id: "mempelaiGroom", scene: "groom", pos: "middle", reveal: "right" },
    { id: "mempelaiBride", scene: "bride", pos: "middle", reveal: "left" },
    { id: "details", scene: "aisle", pos: "bottom" },
    { id: "programme", scene: "garden", reveal: "right" },
    { id: "portraits", scene: "chandelier", reveal: "zoom" },
    { id: "gallery", scene: "garden", reveal: "left" },
    { id: "doa", scene: "stage", pos: "top", reveal: "zoom" },
    { id: "rsvp", scene: "aisle", pos: "bottom" },
    { id: "thanks", scene: "stage", pos: "top" }
  ],

  // Read by public/core/card.js
  client: {
    scenes: true,
    fairyLights: 22,
    petals: ["#8f1a2c", "#a3283b", "#6f1020", "#c23a4e", "#b8860b"],
    openingDelay: 250,
    wishesPerPage: 2   // ucapan shown per page in the wishes list
  }
} as const;
