import { FONT_METADATA } from '../data/fonts';

const FALLBACK = {
  Serif: 'serif',
  Monospace: 'monospace',
  Handwriting: 'cursive',
  Display: 'sans-serif',
  'Sans Serif': 'sans-serif',
};

/** A category-appropriate generic fallback beats hard-coding `sans-serif`. */
export const fallbackFor = (family) =>
  FALLBACK[FONT_METADATA.find((m) => m.family === family)?.category] ?? 'sans-serif';

export const stack = (family) => `'${family}', ${fallbackFor(family)}`;

/** Build the inline style object for a font + its controls. */
export const typeStyle = (family, controls, lineHeightOverride) => ({
  fontFamily: stack(family),
  fontSize: `${controls.size}px`,
  fontWeight: controls.weight,
  lineHeight: lineHeightOverride ?? controls.lh,
  letterSpacing: `${controls.ls}em`,
});
