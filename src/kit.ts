// The card kit: everything the builder (Warkah Kad's Worker and app) needs to know about what a valid Warkah card is.
// `npm run kit` bundles this file into kit/index.js. Nothing here may import Astro, Node or the DOM.
export { validateEvent } from "./lib/validate";
export type { Problem } from "./lib/validate";
export { draftStatus, effectiveFeatures, LIMITS } from "./lib/draft-status";
export type { DraftStatus, Missing, Locked, StatusOptions } from "./lib/draft-status";
export { completeDraft, metaFor, calendarTextFor, builderHosting, CARD_DOMAIN } from "./lib/system-fields.js";
export { sampleFor, previewDraft, assetSetFor } from "./lib/sample";
export { sampleEvent, fillWithSample, PERSONAL_FIELDS } from "./lib/sample-merge.js";
export { isValidSlug, slugProblem, suggestSlug, RESERVED_SLUGS } from "./lib/slug.js";
export { linesToHtml, htmlToLines, cleanLines, escapeHtml, decodeEntities, LINES_AS_HTML, LINES_AS_LIST } from "./lib/lines.js";
export { toIso, fromIso, addHours, DEFAULT_TZ } from "./lib/datetime.js";
export { sanitizeDraft, safeHtml } from "./lib/sanitize.js";
export { checkUrl } from "./lib/urls.js";
export { imageInfo, fileKind, MIME } from "./lib/images.js";
export { getPath, setPath, hasValue } from "./lib/paths.js";
export { mergePatch, isNoop } from "./lib/merge-patch.js";
export { BUILDER_STEPS, labelFor } from "./lib/builder-steps";
export type { BuilderField, BuilderStep } from "./lib/builder-steps";
export { FEATURES, OFFERED_FEATURES, FEATURE_KEYS } from "./lib/features";
export type { FeatureDef } from "./lib/features";
export { OUTFIT_COLOURS, parseHex, recolourOptionsFor, recolourOutfit } from "./lib/recolour.js";
export { ADDONS, ADDON_KEYS, TIERS } from "./lib/tiers";
export type { Addon, Tier } from "./lib/tiers";
export { ASSET_RULES } from "./lib/asset-rules";
export type { AssetRule } from "./lib/asset-rules";
export { THEME_KEYS } from "./lib/theme-keys";
export type { ThemeKey } from "./lib/theme-keys";
export { DAYS, MONTHS, partsIn, time12 } from "./lib/dates.js";
