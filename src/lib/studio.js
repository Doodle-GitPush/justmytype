// Shared constants for the full-screen studios (Animate, Poster, Letter Lab).

export const PALETTES = [
  { id: 'theme', label: 'Theme', bg: 'hsl(var(--background))', fg: 'hsl(var(--foreground))', ink2: 'hsl(var(--primary))' },
  { id: 'paper', label: 'Paper', bg: '#f4efe6', fg: '#1b1a17', ink2: '#c2410c' },
  { id: 'night', label: 'Night', bg: '#0b0b10', fg: '#f5f5f7', ink2: '#7c83ff' },
  { id: 'accent', label: 'Accent', bg: '#ff4d00', fg: '#fff7f0', ink2: '#2b0a00' },
  { id: 'acid', label: 'Acid', bg: '#d7ff3a', fg: '#111111', ink2: '#ff2e88' },
  { id: 'ocean', label: 'Ocean', bg: '#0b3d91', fg: '#e3f0ff', ink2: '#ffcf33' },
  { id: 'blush', label: 'Blush', bg: '#ffd9e0', fg: '#7a1030', ink2: '#ff6b35' },
];

export const ASPECTS = [
  { id: 'fit', label: 'Fit' },
  { id: '1/1', label: '1:1' },
  { id: '4/5', label: '4:5' },
  { id: '9/16', label: '9:16' },
  { id: '16/9', label: '16:9' },
];

export const ratioOf = (aspect) => {
  const [w, h] = aspect.split('/').map(Number);
  return w / h;
};

/** Largest w×h of `ratio` fitting inside `box`. */
export const fitBox = (box, ratio) => {
  const w = Math.min(box.w, box.h * ratio);
  return { w: Math.floor(w), h: Math.floor(w / ratio) };
};

/** Seeded PRNG (mulberry32) — same seed, same artwork. */
export const rng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Resolve a CSS colour (including `hsl(var(--x))`) to something canvas accepts. */
export const resolveColor = (value, el = document.body) => {
  if (!value?.includes('var(')) return value;
  const probe = document.createElement('span');
  probe.style.color = value;
  el.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c;
};
