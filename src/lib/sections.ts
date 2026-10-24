// Turns a theme section entry ({ scene, pos, reveal }) into the data-* attributes card.js and the theme CSS read.
export interface SectionLayout { id: string; scene?: string; pos?: string; reveal?: string }

export function sectionAttrs(layout: SectionLayout) {
  const attrs: Record<string, string> = {};
  if (layout.scene) attrs["data-scene"] = layout.scene;
  if (layout.pos) attrs["data-pos"] = layout.pos;
  if (layout.reveal) attrs["data-reveal"] = layout.reveal;
  return attrs;
}
