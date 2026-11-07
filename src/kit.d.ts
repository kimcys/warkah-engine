// Types of the card kit (kit/index.d.ts is a copy of this file). Hand-written: keep it in step with src/kit.ts.
export type Lang = "ms" | "en";
export type ThemeKey = "royal-gold" | "lover" | "glasshouse" | "enchanted-garden";
export type TierId = "basic" | "full" | "custom";
export type Draft = Record<string, any>;

export interface Problem { path: string; field: string; message: string }
export interface Missing { path: string; label: string; step: string; reason: "required" | "feature" | "asset" }
export interface Locked { feature: string; label: string; reason: "tier" | "not_offered"; addon?: boolean }
export interface DraftStatus {
  problems: Problem[]; missing: Missing[]; locked: Locked[];
  changes: { path: string; reason: string }[];
  features: Record<string, boolean>;
  completeness: { done: number; total: number };
  ready: boolean;
}
export interface StatusOptions { tier?: TierId; addons?: string[]; lang?: Lang; slug?: string; assets?: string[] }

export function validateEvent(data: unknown): { ok: true } | { ok: false; problems: Problem[] };
export function draftStatus(draft: unknown, options?: StatusOptions): DraftStatus;
export function effectiveFeatures(draft: unknown, tier?: TierId, addons?: string[]): Record<string, boolean>;
export const LIMITS: Record<string, number>;

export function completeDraft(draft: Draft, options: { slug: string; lang?: Lang; cardDomain?: string }): Draft;
export function metaFor(draft: Draft, lang?: Lang): { title?: string; description?: string; ogAlt?: string };
export function calendarTextFor(draft: Draft, lang?: Lang): string;
export function builderHosting(slug: string, domain?: string): { domain: string; base: string };
export const CARD_DOMAIN: string;

export function sampleFor(theme: ThemeKey, lang?: Lang): Draft;
export function previewDraft(draft: Draft, theme: ThemeKey, lang?: Lang): Draft;
export function assetSetFor(theme: ThemeKey): "modern" | "malay";
export function sampleEvent(base: Draft, themeSample: Draft): Draft;
export function fillWithSample(draft: unknown, sample: unknown, path?: string): any;
export const PERSONAL_FIELDS: string[];

export function isValidSlug(slug: string): boolean;
export function slugProblem(slug: string): string | null;
export function suggestSlug(first: string, second: string, taken?: Iterable<string>): string;
export const RESERVED_SLUGS: string[];

export function linesToHtml(input: string | string[]): string;
export function htmlToLines(html: string): string[];
export function cleanLines(input: string | string[]): string[];
export function escapeHtml(text: string): string;
export function decodeEntities(text: string): string;
export const LINES_AS_HTML: string[];
export const LINES_AS_LIST: string[];

export function toIso(date: string, time: string, timeZone?: string): string | null;
export function fromIso(iso: string, timeZone?: string): { date: string; time: string } | null;
export function addHours(iso: string, hours: number, timeZone?: string): string | null;
export const DEFAULT_TZ: string;

export function sanitizeDraft(draft: unknown): { draft: Draft; changes: { path: string; reason: string }[] };
export function safeHtml(input: string): string;
export function checkUrl(kind: "maps" | "waze" | "shop" | "generic", input: string): { ok: true; url: string } | { ok: false; problem: string };
export function imageInfo(bytes: Uint8Array): { type: "png" | "jpeg" | "webp"; width: number; height: number; animated: boolean } | null;
export function fileKind(bytes: Uint8Array): "png" | "jpeg" | "webp" | "mp3" | "m4a" | null;
export const MIME: Record<string, string>;
export function getPath(obj: unknown, path: string): any;
export function setPath<T extends object>(obj: T, path: string, value: unknown): T;
export function hasValue(value: unknown): boolean;
export function mergePatch(target: unknown, patch: unknown): any;
export function isNoop(draft: unknown, patch: unknown): boolean;

export interface BuilderField { path: string; label: string; kind: string; required?: boolean; help?: string; feature?: string; options?: { value: string; label: string }[]; asset?: string }
export interface BuilderStep { id: string; title: string; fields: BuilderField[] }
export const BUILDER_STEPS: BuilderStep[];
export function labelFor(path: string): string | undefined;
export interface FeatureDef { key: string; group: "page" | "addon"; default: boolean; label: string; description: string; needs?: string; offered?: boolean }
export const FEATURES: FeatureDef[];
export const OFFERED_FEATURES: FeatureDef[];
export const FEATURE_KEYS: string[];
export interface Tier { id: TierId; label: string; priceRM: number; features: string[] | "all"; note: string }
export const TIERS: Tier[];
export interface Addon { key: "gifts" | "duitnow"; label: string; priceRM: number; note: string }
export const ADDONS: Addon[];
export const ADDON_KEYS: string[];
export interface AssetRule { key: string; label: string; formats: string[]; maxBytes: number; maxLongEdge?: number; minLongEdge?: number; max?: number; hint: string }
export const ASSET_RULES: AssetRule[];
export const THEME_KEYS: readonly ThemeKey[];

export const DAYS: Record<Lang, string[]>;
export const MONTHS: Record<Lang, string[]>;
export function partsIn(iso: string, timeZone: string): { y: number; m: number; d: number; h: number; min: number; weekday: number };
export function time12(h: number, min: number): string;

/** A fingerprint of the sources this kit was built from; store it with every draft. */
export const KIT_VERSION: string;
