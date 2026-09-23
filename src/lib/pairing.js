import { FONT_METADATA } from '../data/fonts';

/**
 * The pairing engine behind Generate Pair.
 *
 * It used to be two uniform random picks out of ~1,900 families, where
 * roughly 820 are Display or Handwriting faces — most draws were two
 * shouting display fonts, or the same family twice under different names.
 * This picks with intent instead:
 *
 *  - the heading and body each have a role, and only faces that can play
 *    that role are eligible (no script face setting body copy);
 *  - picks lean towards popular families, which are overwhelmingly the
 *    well-made ones, without ever excluding the long tail;
 *  - the two faces must come from different families and, most of the
 *    time, contrast in structure (serif against sans, display against text);
 *  - a hand-picked set of known-good pairings is mixed in;
 *  - a mood narrows what each role is allowed to be.
 */

export const MOODS = [
  { id: 'any', label: 'Any' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'tech', label: 'Tech' },
  { id: 'playful', label: 'Playful' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'retro', label: 'Retro' },
];

// Known-good pairings, each tagged with the moods it suits.
const CURATED = [
  ['Playfair Display', 'Source Sans 3', ['editorial', 'luxury']],
  ['Fraunces', 'Inter', ['editorial']],
  ['DM Serif Display', 'DM Sans', ['editorial', 'luxury']],
  ['Cormorant Garamond', 'Proza Libre', ['luxury', 'editorial']],
  ['Libre Baskerville', 'Montserrat', ['editorial']],
  ['EB Garamond', 'Karla', ['editorial']],
  ['Lora', 'Merriweather Sans', ['editorial']],
  ['Crimson Pro', 'Work Sans', ['editorial']],
  ['Newsreader', 'Figtree', ['editorial']],
  ['Instrument Serif', 'Instrument Sans', ['editorial', 'luxury']],
  ['Bodoni Moda', 'Jost', ['luxury']],
  ['Cinzel', 'Raleway', ['luxury']],
  ['Italiana', 'Manrope', ['luxury']],
  ['Marcellus', 'Mulish', ['luxury']],
  ['Space Grotesk', 'IBM Plex Sans', ['tech']],
  ['Sora', 'Inter', ['tech']],
  ['Manrope', 'JetBrains Mono', ['tech']],
  ['Syne', 'Inter', ['tech']],
  ['Archivo', 'Space Mono', ['tech', 'retro']],
  ['Outfit', 'Source Sans 3', ['tech']],
  ['Unbounded', 'Plus Jakarta Sans', ['tech', 'playful']],
  ['Chakra Petch', 'Rubik', ['tech']],
  ['Bricolage Grotesque', 'Figtree', ['playful', 'tech']],
  ['Fredoka', 'Nunito', ['playful']],
  ['Baloo 2', 'Quicksand', ['playful']],
  ['Lilita One', 'Nunito Sans', ['playful']],
  ['Pacifico', 'Poppins', ['playful', 'retro']],
  ['Bowlby One', 'Urbanist', ['playful']],
  ['Titan One', 'Varela Round', ['playful']],
  ['Shrikhand', 'Karla', ['retro', 'playful']],
  ['Bebas Neue', 'Montserrat', ['tech', 'retro']],
  ['Anton', 'Roboto', ['retro']],
  ['Abril Fatface', 'Lato', ['retro', 'editorial']],
  ['Alfa Slab One', 'Open Sans', ['retro']],
  ['Righteous', 'Poppins', ['retro', 'playful']],
  ['Rye', 'Lora', ['retro']],
  ['Monoton', 'Barlow', ['retro']],
  ['Oswald', 'Merriweather', ['editorial', 'retro']],
  ['Poppins', 'Lora', ['any']],
  ['Montserrat', 'Merriweather', ['any']],
  ['Raleway', 'Roboto Slab', ['any']],
  ['Work Sans', 'Source Serif 4', ['any']],
];

let metaCache = { source: null, map: new Map() };
const metaMap = () => {
  if (metaCache.source !== FONT_METADATA) {
    metaCache = { source: FONT_METADATA, map: new Map(FONT_METADATA.map((m) => [m.family, m])) };
  }
  return metaCache.map;
};

export const metaFor = (family) => metaMap().get(family);

// Families designed around another script (Noto Sans JP, Krub, Amiri…)
// only carry Latin as a supporting cast — and small-caps / hairline cuts
// were never meant to set a paragraph.
const isLatinFirst = (m) => !m.script;
const NOT_FOR_BODY = /\b(SC|Display|Caps|Hairline|Stencil|Decorative|Outline|Shadow|Inline)\b/;

const isText = (m) => m.category === 'Sans Serif' || m.category === 'Serif' || m.category === 'Monospace';
const isSerif = (m) => m.category === 'Serif' || m.stroke === 'Serif' || m.stroke === 'Slab Serif';
const isSlab = (m) => m.stroke === 'Slab Serif';
const hasBold = (m) => m.weights?.some((w) => w >= 600) || m.axes?.some(([t, , max]) => t === 'wght' && max >= 600);
const weightCount = (m) => m.weights?.length ?? 1;
const pop = (m) => m.pop ?? 1500;

// What each mood lets a face do in each role.
const ROLE_RULES = {
  any: {
    heading: (m) => (isText(m) && hasBold(m)) || (m.category === 'Display' && pop(m) < 700),
    body: (m) => (m.category === 'Sans Serif' || m.category === 'Serif') && weightCount(m) >= 2,
  },
  editorial: {
    heading: (m) => isSerif(m) && (hasBold(m) || m.category === 'Display'),
    body: (m) => (m.category === 'Serif' || m.category === 'Sans Serif') && weightCount(m) >= 3,
  },
  tech: {
    heading: (m) => (m.category === 'Sans Serif' || m.category === 'Monospace') && hasBold(m),
    body: (m) => (m.category === 'Sans Serif' || m.category === 'Monospace') && weightCount(m) >= 2,
  },
  playful: {
    heading: (m) => (m.category === 'Display' || m.category === 'Handwriting') && pop(m) < 1100,
    body: (m) => m.category === 'Sans Serif' && weightCount(m) >= 2,
  },
  luxury: {
    heading: (m) => isSerif(m) && !isSlab(m) && m.category !== 'Handwriting',
    body: (m) => m.category === 'Sans Serif' && m.weights?.some((w) => w <= 300),
  },
  retro: {
    heading: (m) => (m.category === 'Display' || isSlab(m)) && pop(m) < 1200,
    body: (m) => (m.category === 'Serif' || m.category === 'Sans Serif') && weightCount(m) >= 2,
  },
};

// "Noto Sans" / "Noto Serif", "IBM Plex *", "Roboto" / "Roboto Slab"…
const stem = (family) => family.split(' ')[0].toLowerCase();

const describe = (m) => {
  if (m.category === 'Monospace') return 'mono';
  if (m.category === 'Handwriting') return 'script';
  if (m.category === 'Display') return isSerif(m) ? 'display serif' : 'display face';
  if (isSlab(m)) return 'slab serif';
  return m.category === 'Serif' ? 'serif' : 'sans';
};

// Compatible with each other: different families, and — most of the time —
// different structure, since contrast is what makes a pair read as two voices.
const compatible = (h, b, strict) => {
  if (h.family === b.family || stem(h.family) === stem(b.family)) return false;
  if (!strict) return true;
  return h.category !== b.category || isSerif(h) !== isSerif(b);
};

// Skewed toward the front of a popularity-sorted list without excluding the tail.
const pickSkewed = (list) => list[Math.floor(list.length * Math.pow(Math.random(), 2.2))];

const recent = [];
const remember = (h, b) => {
  recent.push(`${h}|${b}`);
  if (recent.length > 40) recent.shift();
};
const seen = (h, b) => recent.includes(`${h}|${b}`);

/** Heaviest real weight at or under 800, for a heading. */
export const headingWeight = (family) => {
  const m = metaFor(family);
  const ws = m?.weights?.length ? m.weights : [400];
  const strong = ws.filter((w) => w >= 600 && w <= 800);
  if (strong.length) return strong.includes(700) ? 700 : strong[0];
  return ws.reduce((best, w) => (w > best ? w : best), ws[0]);
};

/** 400 if the family ships it, otherwise the nearest weight it does. */
export const bodyWeight = (family) => {
  const ws = metaFor(family)?.weights?.length ? metaFor(family).weights : [400];
  return ws.reduce((best, w) => (Math.abs(w - 400) < Math.abs(best - 400) ? w : best), ws[0]);
};

const reasonFor = (h, b, mood, curated) => {
  const label = MOODS.find((m) => m.id === mood)?.label;
  const parts = [`${describe(h)} headline × ${describe(b)} body`];
  if (curated) parts.push('hand-picked');
  if (mood !== 'any' && label) parts.unshift(label);
  return parts.join(' · ');
};

/**
 * Picks a pairing.
 *
 * @param {object} opts
 * @param {string[]} opts.pool          fonts allowed by the user's filters
 * @param {string}   opts.mood          one of MOODS' ids
 * @param {string}  [opts.lockedHeading] keep this heading, find a body for it
 * @param {string}  [opts.lockedBody]    keep this body, find a heading for it
 * @returns {{ heading: string, body: string, reason: string }}
 */
export function generatePair({ pool, mood = 'any', lockedHeading, lockedBody }) {
  const map = metaMap();
  const rules = ROLE_RULES[mood] ?? ROLE_RULES.any;
  const poolSet = new Set(pool);

  const candidates = pool
    .map((f) => map.get(f))
    .filter(Boolean)
    .sort((a, b) => pop(a) - pop(b));

  const latin = candidates.filter(isLatinFirst);
  let headings = latin.filter(rules.heading);
  let bodies = latin.filter((m) => rules.body(m) && !NOT_FOR_BODY.test(m.family));
  // A narrow filter set can leave a role empty — fall back to anything in
  // the pool rather than refusing to generate.
  if (!headings.length) headings = candidates;
  if (!bodies.length) bodies = candidates;
  if (!headings.length) {
    const fallback = pool.length ? pool : FONT_METADATA.map((m) => m.family);
    const h = lockedHeading ?? fallback[Math.floor(Math.random() * fallback.length)];
    const b = lockedBody ?? fallback[Math.floor(Math.random() * fallback.length)];
    return { heading: h, body: b, reason: 'random' };
  }

  // A hand-picked pairing now and then, when nothing is locked.
  if (!lockedHeading && !lockedBody && Math.random() < 0.3) {
    const options = CURATED.filter(([h, b, moods]) =>
      (mood === 'any' || moods.includes(mood)) &&
      poolSet.has(h) && poolSet.has(b) && map.has(h) && map.has(b) && !seen(h, b)
    );
    if (options.length) {
      const [h, b] = options[Math.floor(Math.random() * options.length)];
      remember(h, b);
      return { heading: h, body: b, reason: reasonFor(map.get(h), map.get(b), mood, true) };
    }
  }

  const lockedH = lockedHeading ? map.get(lockedHeading) ?? { family: lockedHeading, category: 'Sans Serif' } : null;
  const lockedB = lockedBody ? map.get(lockedBody) ?? { family: lockedBody, category: 'Sans Serif' } : null;

  // Strict contrast first; relax if the pool can't satisfy it.
  for (const strict of [true, true, true, false]) {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const h = lockedH ?? pickSkewed(headings);
      const b = lockedB ?? pickSkewed(bodies);
      if (!h || !b) continue;
      // Tech pairs are often two sans faces on purpose; elsewhere contrast
      // is the rule, with the odd same-structure pair let through.
      const wantContrast = strict && mood !== 'tech' && Math.random() < 0.85;
      if (!compatible(h, b, wantContrast)) continue;
      if (seen(h.family, b.family) && attempt < 40) continue;
      remember(h.family, b.family);
      return { heading: h.family, body: b.family, reason: reasonFor(h, b, mood, false) };
    }
  }

  const h = lockedH ?? headings[0];
  const b = lockedB ?? bodies.find((m) => m.family !== h.family) ?? bodies[0];
  return { heading: h.family, body: b.family, reason: reasonFor(h, b, mood, false) };
}
