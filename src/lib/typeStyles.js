import { FONT_METADATA } from '../data/fonts';

const FALLBACK = {
  Serif: 'serif',
  Monospace: 'monospace',
  Handwriting: 'cursive',
  Display: 'sans-serif',
  'Sans Serif': 'sans-serif',
};

const metaOf = (family) => FONT_METADATA.find((m) => m.family === family);

/** A category-appropriate generic fallback beats hard-coding `sans-serif`. */
export const fallbackFor = (family) =>
  FALLBACK[metaOf(family)?.category] ?? 'sans-serif';

export const stack = (family) => `'${family}', ${fallbackFor(family)}`;

// ── Variable axes ─────────────────────────────────────

const AXIS_NAMES = {
  wght: 'Weight', wdth: 'Width', opsz: 'Optical size', slnt: 'Slant', ital: 'Italic',
  GRAD: 'Grade', SOFT: 'Softness', WONK: 'Wonky', CASL: 'Casual', CRSV: 'Cursive',
  MONO: 'Monospace', XTRA: 'Counter width', XOPQ: 'Thick stroke', YOPQ: 'Thin stroke',
  YTLC: 'Lowercase height', YTUC: 'Uppercase height', YTAS: 'Ascender', YTDE: 'Descender',
  YTFI: 'Figure height', ELSH: 'Element shape', ELXP: 'Element expansion', ELGR: 'Element grid',
  MORF: 'Morph', ROND: 'Roundness', BLED: 'Bleed', SCAN: 'Scanlines', XROT: 'Rotation X',
  YROT: 'Rotation Y', SHRP: 'Sharpness', FLAR: 'Flare', VOLM: 'Volume', INFM: 'Informality',
  SPAC: 'Spacing', EDPT: 'Extrusion depth', EHLT: 'Edge highlight', HEXP: 'Hyper expansion',
  YEAR: 'Year', ARRR: 'AR-RR', BNCE: 'Bounce', SZP1: 'Segment size 1', SZP2: 'Segment size 2',
  XPN1: 'Horizontal pos 1', XPN2: 'Horizontal pos 2', YPN1: 'Vertical pos 1', YPN2: 'Vertical pos 2',
  YELA: 'Vertical element alignment', SHLN: 'Shadow length',
};

export const axisName = (tag) => AXIS_NAMES[tag] ?? tag;

/** [{ tag, min, max, def }] for a variable family, [] otherwise. */
export const axesFor = (family) =>
  (metaOf(family)?.axes ?? []).map(([tag, min, max, def]) => ({ tag, min, max, def }));

/** The wght axis range, when the family is variable in weight. */
export const weightRangeFor = (family) => {
  const w = axesFor(family).find((a) => a.tag === 'wght');
  return w ? [w.min, w.max] : null;
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * `font-variation-settings` for the axes this family actually has — values
 * left over from a previous font's axes are simply ignored, so nothing
 * needs resetting when the font changes. Weight stays on `font-weight`.
 */
export const variationSettings = (family, axes) => {
  if (!axes) return undefined;
  const parts = axesFor(family)
    .filter((a) => a.tag !== 'wght' && axes[a.tag] !== undefined && axes[a.tag] !== a.def)
    .map((a) => `'${a.tag}' ${clamp(axes[a.tag], a.min, a.max)}`);
  return parts.length ? parts.join(', ') : undefined;
};

// ── OpenType features ─────────────────────────────────

/** Features offered in the UI. `on` = the browser's default for that feature. */
export const OT_FEATURES = [
  { tag: 'kern', label: 'Kerning', on: true },
  { tag: 'liga', label: 'Ligatures', on: true },
  { tag: 'calt', label: 'Contextual', on: true },
  { tag: 'dlig', label: 'Rare ligatures' },
  { tag: 'swsh', label: 'Swash' },
  { tag: 'salt', label: 'Alternates' },
  { tag: 'smcp', label: 'Small caps' },
  { tag: 'c2sc', label: 'Caps → small' },
  { tag: 'onum', label: 'Old-style nums' },
  { tag: 'lnum', label: 'Lining nums' },
  { tag: 'tnum', label: 'Tabular nums' },
  { tag: 'frac', label: 'Fractions' },
  { tag: 'zero', label: 'Slashed zero' },
  { tag: 'case', label: 'Case-sensitive' },
  { tag: 'ss01', label: 'Set 1' },
  { tag: 'ss02', label: 'Set 2' },
  { tag: 'ss03', label: 'Set 3' },
  { tag: 'ss04', label: 'Set 4' },
  { tag: 'ss05', label: 'Set 5' },
];

const DEFAULT_ON = new Set(OT_FEATURES.filter((f) => f.on).map((f) => f.tag));

export const featureEnabled = (features, tag) => features?.[tag] ?? DEFAULT_ON.has(tag);

/** `font-feature-settings` — only features that differ from the browser default. */
export const featureSettings = (features) => {
  if (!features) return undefined;
  const parts = Object.entries(features)
    .filter(([tag, on]) => on !== DEFAULT_ON.has(tag))
    .map(([tag, on]) => `'${tag}' ${on ? 1 : 0}`);
  return parts.length ? parts.join(', ') : undefined;
};

/** Axes + features as style props, for places that set their own size/weight. */
export const fxStyle = (family, controls) => ({
  fontVariationSettings: variationSettings(family, controls?.axes),
  fontFeatureSettings: featureSettings(controls?.features),
});

/** Just the face — family plus its axes/features — without size or spacing. */
export const faceOf = (style) => ({
  fontFamily: style.fontFamily,
  fontVariationSettings: style.fontVariationSettings,
  fontFeatureSettings: style.fontFeatureSettings,
});

/** Build the inline style object for a font + its controls. */
export const typeStyle = (family, controls, lineHeightOverride) => ({
  fontFamily: stack(family),
  fontSize: `${controls.size}px`,
  fontWeight: controls.weight,
  lineHeight: lineHeightOverride ?? controls.lh,
  letterSpacing: `${controls.ls}em`,
  ...fxStyle(family, controls),
});
