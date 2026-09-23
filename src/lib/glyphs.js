import { familyQuery, loadFont } from './fontLoader';
import { stack } from './typeStyles';

/**
 * Figures out which characters a font actually draws.
 *
 * Google Fonts splits every family into subsets (latin, latin-ext, greek…)
 * and its CSS lists each subset's `unicode-range`. That's the candidate
 * set. Ranges are generous, though — a subset covers a whole block even
 * where the font skips characters — so each candidate is then checked by
 * measuring it against two different fallbacks: if the font has the glyph
 * both measurements match; if it doesn't, the browser falls through to
 * the fallbacks and they (almost always) disagree.
 */

const MAX_PER_GROUP = 1200;
const MAX_TOTAL = 4000;

// Unassigned, control, surrogate, private-use and whitespace code points
// never make useful cells.
const SKIP = /[\p{Cn}\p{Cc}\p{Cs}\p{Co}\p{Z}]/u;

// For uploaded / self-hosted fonts there's no Google CSS to read —
// probe the blocks a Latin-first font most often covers.
const DEFAULT_RANGES = [
  ['Basic Latin', [[0x21, 0x7e]]],
  ['Latin-1 & Extended', [[0xa1, 0x24f]]],
  ['Punctuation & symbols', [[0x2010, 0x205e], [0x20a0, 0x20c0], [0x2100, 0x214f], [0x2190, 0x21ff], [0x2200, 0x22ff], [0x25a0, 0x25ff], [0xfb00, 0xfb06]]],
];

const parseRanges = (value) =>
  value.split(',').map((part) => {
    const p = part.trim().replace(/^U\+/i, '');
    if (p.includes('-')) {
      const [a, b] = p.split('-');
      return [parseInt(a, 16), parseInt(b, 16)];
    }
    if (p.includes('?')) {
      return [parseInt(p.replace(/\?/g, '0'), 16), parseInt(p.replace(/\?/g, 'F'), 16)];
    }
    const n = parseInt(p, 16);
    return [n, n];
  }).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));

const prettySubset = (name) => {
  if (/^\[\d+\]$/.test(name)) return 'Extended (CJK)';
  return name.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ').replace('Ext', 'Extended');
};

/** [[groupName, [[from, to], …]], …] for a family, from its Google Fonts CSS. */
async function rangesFor(family) {
  try {
    const res = await fetch(`https://fonts.googleapis.com/css2?${familyQuery(family)}&display=swap`);
    if (!res.ok) return DEFAULT_RANGES;
    const css = await res.text();
    const groups = new Map();
    const re = /\/\*\s*([^*]+?)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g;
    let m;
    while ((m = re.exec(css))) {
      const range = /unicode-range:\s*([^;]+);/.exec(m[2]);
      if (!range) continue;
      const name = prettySubset(m[1]);
      const list = groups.get(name) ?? [];
      list.push(...parseRanges(range[1]));
      groups.set(name, list);
    }
    // Latin first — it's what most people come looking for — then the
    // rest in the order Google lists them.
    const rank = (name) => (name === 'Latin' ? 0 : name === 'Latin Extended' ? 1 : 2);
    const entries = [...groups.entries()].sort(([a], [b]) => rank(a) - rank(b));
    return entries.length ? entries : DEFAULT_RANGES;
  } catch {
    return DEFAULT_RANGES;
  }
}

// `seen` is shared across groups: subsets overlap (latin and latin-ext
// both list U+0131, for one), and each glyph should appear once.
const expand = (ranges, limit, seen) => {
  const out = [];
  for (const [a, b] of ranges) {
    for (let cp = a; cp <= b && out.length < limit; cp += 1) {
      if (seen.has(cp)) continue;
      seen.add(cp);
      const ch = String.fromCodePoint(cp);
      if (!SKIP.test(ch)) out.push(cp);
    }
  }
  return out.sort((x, y) => x - y);
};

/**
 * Resolves to [{ name, glyphs: [codePoint, …] }] — only glyphs the font
 * really has. `isLocal` skips the Google lookup (uploaded fonts).
 */
export async function findGlyphs(family, { isLocal = false } = {}) {
  loadFont(family);
  const groups = isLocal ? DEFAULT_RANGES : await rangesFor(family);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const measure = (fontStack, ch) => {
    ctx.font = `40px ${fontStack}`;
    return ctx.measureText(ch).width;
  };
  const withMono = `${stack(family).split(',')[0]}, monospace`;
  const withSerif = `${stack(family).split(',')[0]}, serif`;

  const result = [];
  const seen = new Set();
  let total = 0;
  for (const [name, ranges] of groups) {
    if (total >= MAX_TOTAL) break;
    const candidates = expand(ranges, Math.min(MAX_PER_GROUP, MAX_TOTAL - total), seen);
    if (!candidates.length) continue;

    // Make sure the subset file covering these characters has loaded —
    // faces behind a unicode-range only download when text needs them.
    const sample = String.fromCodePoint(...candidates.slice(0, 400));
    try { await document.fonts.load(`40px ${withMono}`, sample); } catch { /* measure anyway */ }

    const glyphs = candidates.filter((cp) => {
      const ch = String.fromCodePoint(cp);
      return Math.abs(measure(withMono, ch) - measure(withSerif, ch)) < 0.01;
    });
    if (glyphs.length) {
      result.push({ name, glyphs });
      total += glyphs.length;
    }
  }
  return result;
}

export const hex = (cp) => cp.toString(16).toUpperCase().padStart(4, '0');
