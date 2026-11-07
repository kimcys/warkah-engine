// Theme registry. To add a theme: copy src/themes/royal-gold/, rename, register it here,
// and add its name to THEME_KEYS in src/lib/theme-keys.ts. See THEMES.md for the checklist.
import royalGold from "./royal-gold/theme";
import lover from "./lover/theme";
import glasshouse from "./glasshouse/theme";
import enchantedGarden from "./enchanted-garden/theme";
import { THEME_KEYS } from "../lib/theme-keys";

export const themes = {
  "royal-gold": royalGold,
  lover,
  glasshouse,
  "enchanted-garden": enchantedGarden
};

export type ThemeName = keyof typeof themes;

for (const key of THEME_KEYS) if (!(key in themes)) throw new Error(`THEME_KEYS lists "${key}" but src/themes/index.ts does not register it`);
for (const key of Object.keys(themes)) if (!(THEME_KEYS as readonly string[]).includes(key)) throw new Error(`Theme "${key}" is registered but missing from THEME_KEYS (src/lib/theme-keys.ts)`);
