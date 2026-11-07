// Theme registry. To add a theme: copy src/themes/royal-gold/, rename, register it here,
// and add its name to the `theme` enum in src/content.config.ts. See THEMES.md for the checklist.
import royalGold from "./royal-gold/theme";
import lover from "./lover/theme";
import glasshouse from "./glasshouse/theme";
import enchantedGarden from "./enchanted-garden/theme";

export const themes = {
  "royal-gold": royalGold,
  lover,
  glasshouse,
  "enchanted-garden": enchantedGarden
};

export type ThemeName = keyof typeof themes;
