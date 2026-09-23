// Enriches public/font-metadata.json with data from Google Fonts' own
// catalogue: variable-font axes, popularity rank, stroke classification
// and script subsets. Run with `npm run fonts:enrich` — it rewrites the
// file in place and keeps the existing family/category/weights/hasItalic
// fields untouched, only adding the new ones.
//
//   axes:  [[tag, min, max, default], …]   (only for variable families)
//   pop:   popularity rank, 1 = most used
//   stroke: 'Sans Serif' | 'Serif' | 'Slab Serif' (omitted when unknown)
//   subsets: ['latin', 'cyrillic', …]      ('menu' dropped)
import { readFile, writeFile } from 'node:fs/promises';

const FILE = new URL('../public/font-metadata.json', import.meta.url);

const res = await fetch('https://fonts.google.com/metadata/fonts');
if (!res.ok) throw new Error(`Google Fonts metadata: HTTP ${res.status}`);
const text = await res.text();
// The endpoint prefixes its JSON with an XSSI guard (`)]}'`).
const catalogue = JSON.parse(text.slice(text.indexOf('{')));
const byFamily = new Map(catalogue.familyMetadataList.map((f) => [f.family, f]));

const current = JSON.parse(await readFile(FILE, 'utf8'));
let enriched = 0;

const out = current.map((entry) => {
  const g = byFamily.get(entry.family);
  if (!g) return entry;
  enriched += 1;
  const next = { ...entry, pop: g.popularity };
  if (g.axes?.length) {
    next.axes = g.axes.map((a) => [a.tag, a.min, a.max, a.defaultValue]);
  }
  if (g.stroke) next.stroke = g.stroke;
  const subsets = (g.subsets || []).filter((s) => s !== 'menu');
  if (subsets.length) next.subsets = subsets;
  return next;
});

await writeFile(FILE, JSON.stringify(out));
console.log(`Enriched ${enriched} of ${current.length} families.`);
