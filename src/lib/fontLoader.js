import { FONT_METADATA } from '../data/fonts';

// One module, one cache. Previously App, FontSection and FontInfoPanel each
// kept a private Set, so every family was requested two or three times.
const requested = new Set();

/** Families bundled locally via @font-face — never fetch these from Google. */
const LOCAL_FAMILIES = new Set(['Wanted Sans']);

/**
 * Ask Google Fonts only for the weights a family actually publishes.
 * 1,077 of 1,926 families ship a single weight; requesting 300–800 for those
 * just makes the browser synthesise the rest.
 */
const axisFor = (family) => {
  const meta = FONT_METADATA.find((m) => m.family === family);
  if (!meta?.weights?.length) return '';

  const weights = [...meta.weights].sort((a, b) => a - b);
  return meta.hasItalic
    ? `:ital,wght@${weights.map((w) => `0,${w}`).join(';')};${weights.map((w) => `1,${w}`).join(';')}`
    : `:wght@${weights.join(';')}`;
};

/**
 * For a variable family, request every axis as a full range instead, so
 * the axis sliders and in-between weights render real instances rather
 * than snapping to the nearest static cut. The CSS2 API wants registered
 * (lowercase) axes alphabetically first, then custom (uppercase) ones.
 */
const variableAxisFor = (family) => {
  const meta = FONT_METADATA.find((m) => m.family === family);
  const axes = (meta?.axes ?? []).filter(([tag]) => tag !== 'ital');
  if (!axes.length) return null;

  const lower = axes.filter(([t]) => t === t.toLowerCase()).sort(([a], [b]) => a.localeCompare(b));
  const upper = axes.filter(([t]) => t !== t.toLowerCase()).sort(([a], [b]) => (a < b ? -1 : 1));
  const ordered = [...lower, ...upper];
  const tags = ordered.map(([t]) => t).join(',');
  const ranges = ordered.map(([, min, max]) => `${min}..${max}`).join(',');

  return meta.hasItalic
    ? `:ital,${tags}@0,${ranges};1,${ranges}`
    : `:${tags}@${ranges}`;
};

/** `family=Name:axes@…` — the same request the app makes, for Copy CSS. */
export const familyQuery = (family) =>
  `family=${family.replace(/\s+/g, '+')}${variableAxisFor(family) ?? axisFor(family)}`;

const cssUrl = (family, axis) =>
  `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}${axis}&display=swap`;

export function loadFont(family) {
  if (!family || requested.has(family) || LOCAL_FAMILIES.has(family)) return;
  requested.add(family);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  const variable = variableAxisFor(family);
  link.href = cssUrl(family, variable ?? axisFor(family));
  // A few families publish axis ranges the API won't serve for every
  // style — fall back to the static weights rather than no font at all.
  if (variable) {
    link.onerror = () => {
      link.onerror = null;
      link.href = cssUrl(family, axisFor(family));
    };
  }
  document.head.appendChild(link);
}

/** Marks a family as already loaded — for fonts added directly via the
 *  FontFace API (user uploads), so loadFont never tries to fetch them
 *  from Google afterwards. */
export function registerLoadedFont(family) {
  requested.add(family);
}

/** Resolves once the family has actually painted (or after `timeout` ms). */
export function whenFontReady(family, timeout = 3000) {
  loadFont(family);
  if (!family || !document.fonts) return Promise.resolve();

  return Promise.race([
    document.fonts.load(`400 16px "${family}"`).then(() => document.fonts.ready),
    new Promise((resolve) => setTimeout(resolve, timeout)),
  ]);
}
