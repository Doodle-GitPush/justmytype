import { stack } from './typeStyles';

/**
 * Poster model + canvas renderer. The editor draws the same model with
 * DOM (so text stays crisp and editable); export redraws it here at print
 * resolution. The two are kept in step by construction — same box model:
 * each layer is a block of pre-wrapped lines centred on (x, y), rotated
 * around that centre.
 */

export const ARTBOARD_W = 1000;

export const BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'difference', 'exclusion'];

let nextId = 1;
export const newId = () => `l${Date.now().toString(36)}${(nextId++).toString(36)}`;

export const makeLayer = (over = {}) => ({
  id: newId(),
  text: 'New text',
  role: 'primary',
  size: 90,
  weight: 700,
  color: '#111111',
  fill: true,
  stroke: 0,
  strokeColor: '#111111',
  opacity: 1,
  rotation: 0,
  x: 0.5,
  y: 0.5,
  align: 'center',
  lh: 1,
  ls: 0,
  blend: 'normal',
  upper: false,
  ...over,
});

/** Break text into lines of roughly `max` characters, on word boundaries. */
const wrap = (text, max) => {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && (line + ' ' + word).length > max) { lines.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines.join('\n');
};

/** Starting layouts. `t` is the user's sample text. */
export const TEMPLATES = [
  {
    id: 'headline',
    label: 'Headline',
    make: (t) => ({
      aspect: '4/5',
      bg: { type: 'solid', a: '#f4efe6', b: '#e9d8c4', angle: 160 },
      layers: [
        makeLayer({ text: 'VOL. 01 — TYPE SPECIMEN', role: 'secondary', size: 22, weight: 500, ls: 0.2, x: 0.5, y: 0.08, color: '#1b1a17' }),
        makeLayer({ text: wrap(t, 12), size: Math.max(70, 150 - t.length), lh: 0.95, x: 0.5, y: 0.47, color: '#1b1a17' }),
        makeLayer({ text: 'A poster made with JustMyType', role: 'secondary', size: 28, weight: 400, x: 0.5, y: 0.9, color: '#c2410c' }),
      ],
    }),
  },
  {
    id: 'swiss',
    label: 'Swiss',
    make: (t) => ({
      aspect: '4/5',
      bg: { type: 'solid', a: '#d7ff3a', b: '#b6e61b', angle: 180 },
      layers: [
        makeLayer({ text: t.split(' ')[0] || t, size: 300, lh: 0.85, rotation: -90, x: 0.2, y: 0.5, color: '#111111', upper: true }),
        makeLayer({ text: wrap(t, 18), role: 'secondary', size: 34, weight: 500, align: 'left', lh: 1.2, x: 0.68, y: 0.8, color: '#111111' }),
        makeLayer({ text: '●', size: 140, x: 0.78, y: 0.2, color: '#ff2e88' }),
      ],
    }),
  },
  {
    id: 'echo',
    label: 'Echo',
    make: (t) => {
      const word = t.split(' ').slice(0, 2).join(' ') || t;
      return {
        aspect: '9/16',
        bg: { type: 'gradient', a: '#0b0b10', b: '#3a1c71', angle: 180 },
        layers: [0, 1, 2, 3, 4, 5, 6].map((i) => makeLayer({
          text: word,
          size: 130,
          upper: true,
          x: 0.5,
          y: 0.2 + i * 0.1,
          fill: i === 3,
          color: '#f5f5f7',
          stroke: i === 3 ? 0 : 2,
          strokeColor: '#f5f5f7',
          opacity: 1 - Math.abs(3 - i) * 0.2,
        })),
      };
    },
  },
  {
    id: 'overprint',
    label: 'Overprint',
    make: (t) => ({
      aspect: '1/1',
      bg: { type: 'solid', a: '#fffaf2', b: '#ffffff', angle: 180 },
      layers: [
        makeLayer({ text: (t.match(/[A-Za-z]/) || ['A'])[0].toUpperCase(), size: 900, lh: 0.8, x: 0.42, y: 0.52, color: '#00b3ff', blend: 'multiply' }),
        makeLayer({ text: (t.match(/[A-Za-z]/g) || ['A', 'a'])[1]?.toUpperCase() ?? 'B', size: 900, lh: 0.8, x: 0.6, y: 0.5, color: '#ff2e88', blend: 'multiply', rotation: 8 }),
        makeLayer({ text: wrap(t, 48), role: 'secondary', size: 30, weight: 500, x: 0.5, y: 0.92, color: '#111111' }),
      ],
    }),
  },
  {
    id: 'blank',
    label: 'Blank',
    make: (t) => ({
      aspect: '4/5',
      bg: { type: 'solid', a: '#ffffff', b: '#eeeeee', angle: 180 },
      layers: [makeLayer({ text: wrap(t, 16) })],
    }),
  },
];

export const heightFor = (aspect) => {
  const [w, h] = aspect.split('/').map(Number);
  return Math.round((ARTBOARD_W * h) / w);
};

/** CSS for the background, for the DOM editor. */
export const bgCss = (bg) => {
  if (bg.type === 'gradient') return { background: `linear-gradient(${bg.angle}deg, ${bg.a}, ${bg.b})` };
  if (bg.type === 'image' && bg.image) return { background: `${bg.a} url(${bg.image}) center / cover no-repeat` };
  return { background: bg.a };
};

const lineMetrics = (ctx, size) => {
  const m = ctx.measureText('Hg');
  return {
    ascent: m.fontBoundingBoxAscent ?? size * 0.8,
    descent: m.fontBoundingBoxDescent ?? size * 0.2,
  };
};

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

/**
 * Render the poster to a canvas `scale`× the artboard's 1000px width.
 * `families` maps role → font family.
 */
export async function renderPoster(poster, families, scale = 2) {
  const W = ARTBOARD_W;
  const H = heightFor(poster.aspect);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // Webfonts must be loaded before canvas can draw with them.
  await Promise.all(poster.layers.map((l) =>
    document.fonts.load(`${l.weight} ${l.size}px ${stack(families[l.role])}`, l.text).catch(() => {})
  ));

  const { bg } = poster;
  if (bg.type === 'gradient') {
    // Same geometry as CSS linear-gradient: 0deg points up, the line runs
    // through the centre and is long enough to reach the far corners.
    const a = (bg.angle * Math.PI) / 180;
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    const len = Math.abs(W * dx) + Math.abs(H * dy);
    const g = ctx.createLinearGradient(W / 2 - (dx * len) / 2, H / 2 - (dy * len) / 2, W / 2 + (dx * len) / 2, H / 2 + (dy * len) / 2);
    g.addColorStop(0, bg.a);
    g.addColorStop(1, bg.b);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = bg.a;
  }
  ctx.fillRect(0, 0, W, H);

  if (bg.type === 'image' && bg.image) {
    try {
      const img = await loadImage(bg.image);
      const s = Math.max(W / img.width, H / img.height);
      ctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
    } catch { /* keep the flat colour */ }
  }

  for (const l of poster.layers) {
    const text = l.upper ? l.text.toUpperCase() : l.text;
    const lines = text.split('\n');
    ctx.save();
    ctx.translate(l.x * W, l.y * H);
    ctx.rotate((l.rotation * Math.PI) / 180);
    ctx.globalAlpha = l.opacity;
    ctx.globalCompositeOperation = l.blend === 'normal' ? 'source-over' : l.blend;
    ctx.font = `${l.weight} ${l.size}px ${stack(families[l.role])}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${l.ls * l.size}px`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';

    const widths = lines.map((ln) => ctx.measureText(ln).width);
    const maxW = Math.max(...widths, 0);
    const lineH = l.lh * l.size;
    const totalH = lines.length * lineH;
    const { ascent, descent } = lineMetrics(ctx, l.size);

    lines.forEach((ln, i) => {
      const w = widths[i];
      const x = l.align === 'left' ? -maxW / 2 : l.align === 'right' ? maxW / 2 - w : -w / 2;
      const y = -totalH / 2 + i * lineH + (lineH - (ascent + descent)) / 2 + ascent;
      if (l.fill) {
        ctx.fillStyle = l.color;
        ctx.fillText(ln, x, y);
      }
      if (l.stroke > 0) {
        ctx.lineWidth = l.stroke;
        ctx.strokeStyle = l.strokeColor;
        ctx.strokeText(ln, x, y);
      }
    });
    ctx.restore();
  }
  return canvas;
}
