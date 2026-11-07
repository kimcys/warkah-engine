// Glasshouse: the concept video's white glasshouse wedding. Each page is a frame of the video (public/bg/,
// sample text and watermark cleaned out) with the card's own words laid on it in the same place.
// Guests walk through it page by page: arch → doorway → lamp-post sign → hall → the couple → details
// → telephone booth → rose garden (doa) → back out to the arch.
import Opening from "./Opening.astro";
import Backdrop from "./Backdrop.astro";
import { defineTheme } from "../define";
import Hero from "./sections/Hero.astro";
import Invitation from "./sections/Invitation.astro";
import MempelaiFirst from "./sections/MempelaiFirst.astro";
import MempelaiSecond from "./sections/MempelaiSecond.astro";
import Details from "./sections/Details.astro";
import Countdown from "./sections/Countdown.astro";
import Programme from "./sections/Programme.astro";
import Signpost from "./sections/Signpost.astro";
import Ayat from "./sections/Ayat.astro";
import Doa from "./sections/Doa.astro";

// How the card scrolls:
//  "pages": the Royal Gold way. One page per screen that snaps; the scenes are fixed layers behind that crossfade with a
//           camera move when the page changes; each panel's lines rise in one after another. The words printed on a
//           scene live inside its layer, so they zoom and fade together with their board.
//  "free":  one continuous scroll (Blossom style): scenes blend into each other, every line zooms up as it scrolls in.
const SCROLL: "pages" | "free" = "pages";

export default defineTheme("glasshouse", {
  name: "Glasshouse",
  Opening,
  Backdrop,
  layout: "pages",
  scroll: SCROLL,
  themeColor: "#e9efe6",
  fonts:
    "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Libre+Baskerville:wght@400;700&family=Pinyon+Script&family=Jost:wght@400;500;600&display=swap",
  preload: ["bg/opening.webp", "bg/arch.webp"],
  stylesheet: "style.css",

  // Pages this theme draws itself.
  components: { hero: Hero, invitation: Invitation, mempelaiGroom: MempelaiFirst, mempelaiBride: MempelaiSecond, details: Details, countdown: Countdown, programme: Programme, venueSign: Signpost, ayat: Ayat, doa: Doa },

  // Same walk as the concept. The bride and groom pages choose their own frame (data-scene = bride / groom).
  sections: [
    { id: "hero", scene: "arch" },
    { id: "invitation", scene: "court" },
    { id: "venueSign", scene: "lamp" },
    { id: "ayat", scene: "hall" },
    { id: "mempelaiGroom", scene: "groom", reveal: "left" },
    { id: "mempelaiBride", scene: "bride", reveal: "right" },
    { id: "details", scene: "stage" },
    { id: "countdown", scene: "aisle", pos: "top", reveal: "zoom" },
    { id: "portraits", scene: "hall", reveal: "zoom" },
    { id: "gallery", scene: "hall", reveal: "zoom" },
    { id: "programme", scene: "phone", pos: "top" },
    { id: "dressCode", scene: "lamp", pos: "top" },
    { id: "doa", scene: "roses" },
    { id: "rsvp", scene: "garden", pos: "top" },
    { id: "wishes", scene: "court", pos: "top" },
    { id: "gifts", scene: "lamp", pos: "top" },
    { id: "thanks", scene: "gate", pos: "top" }
  ],

  // Scenes with no one painted in, for when a client picks a groom/bride model (otherwise the painted couple scenes show)
  modelScenes: { groom: "court", bride: "phone" },

  // Read by public/core/card.js
  client: {
    fairyLights: 10,
    petals: [],
    openingDelay: 700
  }
});
