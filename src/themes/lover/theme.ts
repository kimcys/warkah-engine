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

  // Read by public/core/card.js
  client: {
    fairyLights: 16,
    petals: ["#df6093", "#ef8ab3", "#8fd0e8", "#f2cf63"],
    openingDelay: 150
  }
});
