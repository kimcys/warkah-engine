// The standard page list every theme follows, how a page is switched on/off by an event's features,
// and how a theme's section entry ({ scene, pos, reveal }) becomes the data-* attributes card.js and the CSS read.

// Pages every theme MUST have (in its own order). defineTheme() stops the build if one is missing.
export const REQUIRED_SECTIONS = [
  "hero", "invitation", "mempelaiGroom", "mempelaiBride", "details", "countdown", "programme",
  "portraits", "gallery", "doa", "ayat", "venueSign", "dressCode", "rsvp", "wishes", "gifts", "thanks"
] as const;

// Pages a theme MAY add on top of the standard ones (none yet; a theme draws them itself).
export const OPTIONAL_SECTIONS = [] as const;   // reserved for pages only one theme draws

export type SectionId = (typeof REQUIRED_SECTIONS)[number] | (typeof OPTIONAL_SECTIONS)[number];

export interface SectionLayout {
  id: SectionId;
  scene?: string;                                         // which scene sits behind the page (themes with scenes)
  pos?: "top" | "middle" | "bottom";                      // where the panel sits on the page
  reveal?: "left" | "right" | "zoom";                     // how the panel enters
}

// One table decides which pages an event shows. An id that is not listed is always shown.
export function sectionEnabled(id: SectionId, e: { features: Record<string, boolean>; gallery: unknown[]; dressCode?: unknown }): boolean {
  const f = e.features;
  switch (id) {
    case "mempelaiGroom":
    case "mempelaiBride": return f.mempelai;
    case "portraits": return f.portraits;
    case "gallery": return f.gallery && e.gallery.length > 0;
    case "doa": return f.doa;
    case "rsvp": return f.rsvp;
    case "wishes": return f.wishes;
    case "ayat": return f.ayat;
    case "venueSign": return f.venueSign;
    case "gifts": return f.gifts || f.duitnow;           // add-ons: Warkah Hadiah + DuitNow
    case "dressCode": return !!e.dressCode;
    default: return true;
  }
}

export function sectionAttrs(layout: SectionLayout) {
  const attrs: Record<string, string> = {};
  if (layout.scene) attrs["data-scene"] = layout.scene;
  if (layout.pos) attrs["data-pos"] = layout.pos;
  if (layout.reveal) attrs["data-reveal"] = layout.reveal;
  return attrs;
}
