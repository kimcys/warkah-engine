// Enchanted Garden: the original Nadiah & Ezzan card, as a theme. A gold mirror floating in the sky opens onto a
// garden poster, then full-page scenes (arch, garden, sky) fade behind a floating frosted panel.
import Opening from "./Opening.astro";
import Backdrop from "./Backdrop.astro";
import Hero from "./sections/Hero.astro";
import Invitation from "./sections/Invitation.astro";
import Details from "./sections/Details.astro";
import Countdown from "./sections/Countdown.astro";
import Programme from "./sections/Programme.astro";
import Rsvp from "./sections/Rsvp.astro";
import Wishes from "./sections/Wishes.astro";
import Thanks from "./sections/Thanks.astro";

export default {
  name: "Enchanted Garden",
  Opening,
  Backdrop,
  bodyClass: "layout-pages",
  themeColor: "#8fc6ec",
  fonts:
    "https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cormorant+Garamond:wght@500;600;700&family=Montserrat:wght@300;400;600;800&family=Noto+Naskh+Arabic:wght@400;700&display=swap",
  preload: ["opening/mirror.webp?v=2"],
  stylesheet: "style.css",
  calendarNav: true,            // the bottom bar also shows a Kalendar button, as in the original

  components: { hero: Hero, invitation: Invitation, details: Details, countdown: Countdown, programme: Programme, rsvp: Rsvp, wishes: Wishes, thanks: Thanks },

  // Page order + the scene behind each page (garden = the base background, arch and sky are layers)
  sections: [
    { id: "hero", scene: "garden" },
    { id: "invitation", scene: "arch" },
    { id: "details", scene: "garden" },
    { id: "programme", scene: "garden", reveal: "right" },
    { id: "countdown", scene: "sky" },
    { id: "portraits", scene: "arch", reveal: "zoom" },
    { id: "gallery", scene: "garden", reveal: "left" },
    { id: "doa", scene: "sky", reveal: "zoom" },
    { id: "rsvp", scene: "garden" },
    { id: "wishes", scene: "arch", reveal: "left" },
    { id: "thanks", scene: "garden" }
  ],

  // Read by public/core/card.js
  client: {
    scenes: true,
    fairyLights: 22,
    petals: ["#f0a9bb", "#f6c3cf", "#e994aa", "#fbe2e8", "#f3b6c4"],
    openingDelay: 650
  }
} as const;
