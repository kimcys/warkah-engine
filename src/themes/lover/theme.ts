// Lover: soft pink, sky blue and butter-yellow pastel card. A single scrolling page of frosted-glass cards
// (no full-page scenes). Section order and the ambience settings live here.
import Opening from "./Opening.astro";
import Backdrop from "./Backdrop.astro";
import Hero from "./sections/Hero.astro";
import Invitation from "./sections/Invitation.astro";
import Details from "./sections/Details.astro";
import Countdown from "./sections/Countdown.astro";
import Programme from "./sections/Programme.astro";
import DressCode from "./sections/DressCode.astro";

export default {
  name: "Lover",
  Opening,
  Backdrop,
  bodyClass: "layout-scroll",
  themeColor: "#ffd7e9",
  fonts:
    "https://fonts.googleapis.com/css2?family=Allura&family=Cormorant+Garamond:wght@500;600;700&family=Montserrat:wght@300;400;600;800&family=Noto+Naskh+Arabic:wght@400;700&family=Satisfy&display=swap",
  preload: ["bg/lover-background.webp"],
  stylesheet: "style.css",

  // Pages this theme draws itself (the card page uses these instead of the shared ones).
  components: { hero: Hero, invitation: Invitation, details: Details, countdown: Countdown, programme: Programme, dressCode: DressCode },

  sections: [
    { id: "hero" },
    { id: "invitation" },
    { id: "mempelaiGroom" },
    { id: "mempelaiBride" },
    { id: "details" },
    { id: "countdown" },
    { id: "portraits" },
    { id: "gallery" },
    { id: "programme" },
    { id: "dressCode" },
    { id: "doa" },
    { id: "rsvp" },
    { id: "thanks" }
  ],

  // Read by public/core/card.js
  client: {
    scenes: false,
    fairyLights: 16,
    petals: ["#df6093", "#ef8ab3", "#8fd0e8", "#f2cf63"],
    openingDelay: 150
  }
} as const;
