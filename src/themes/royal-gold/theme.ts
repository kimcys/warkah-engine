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

  // Read by public/core/card.js
  client: {
    fairyLights: 22,
    petals: ["#8f1a2c", "#a3283b", "#6f1020", "#c23a4e", "#b8860b"],
    openingDelay: 250,
    wishesPerPage: 2   // ucapan shown per page in the wishes list
  }
});
