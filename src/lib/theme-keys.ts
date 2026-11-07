// The theme folder names a client can choose (src/themes/<name>). Register a new theme here, in src/themes/index.ts.
export const THEME_KEYS = ["royal-gold", "lover", "glasshouse", "enchanted-garden"] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];
