import { rng } from './studio';

/**
 * Letter Lab — generative layouts built from glyphs. Each mode draws into
 * a canvas using a logical 1000px-wide space, so the on-screen preview
 * and the high-resolution export are the same drawing at different scales.
 * Everything random comes from a seeded PRNG: same seed, same artwork.
 *
 * `params`: [key, label, min, max, step, default]
 */

export const LAB_W = 1000;

export const LAB_MODES = {
  grid: {
    label: 'Grid',
    params: [['cols', 'Columns', 2, 40, 1, 8], ['scale', 'Glyph size', 0.2, 2.5, 0.05, 0.9], ['twist', 'Twist', 0, 90, 1, 0], ['jitter', 'Rotate jitter', 0, 180, 1, 0], ['sizeJitter', 'Size jitter', 0, 1, 0.01, 0], ['mix', 'Accent mix', 0, 1, 0.01, 0.15]],
  },
  radial: {
    label: 'Radial',
    params: [['rings', 'Rings', 1, 20, 1, 7], ['scale', 'Glyph size', 0.2, 2, 0.05, 0.8], ['spacing', 'Spacing', 0.6, 3, 0.05, 1.1], ['spin', 'Ring offset', 0, 60, 1, 8], ['mix', 'Accent mix', 0, 1, 0.01, 0.2]],
  },
  wave: {
    label: 'Wave',
    params: [['rows', 'Rows', 3, 60, 1, 14], ['amp', 'Amplitude', 0, 200, 1, 40], ['freq', 'Frequency', 0.1, 8, 0.05, 1.5], ['phase', 'Row phase', 0, 3.2, 0.05, 0.35], ['mix', 'Accent mix', 0, 1, 0.01, 0.1]],
  },
  mask: {
    label: 'Mask',
    params: [['wordSize', 'Word size', 100, 900, 5, 420], ['density', 'Pattern size', 8, 80, 1, 22], ['angle', 'Pattern angle', -90, 90, 1, -20], ['ghost', 'Ghost', 0, 1, 0.01, 0.08], ['mix', 'Accent mix', 0, 1, 0.01, 0.35]],
  },
  echo: {
    label: 'Echo',
    params: [['copies', 'Copies', 2, 40, 1, 12], ['size', 'Size', 40, 700, 5, 220], ['dx', 'Offset X', -80, 80, 1, 0], ['dy', 'Offset Y', -80, 80, 1, 28], ['shrink', 'Shrink', 0, 0.15, 0.005, 0.03], ['outline', 'Outline', 0, 8, 0.5, 2]],
  },
  scatter: {
    label: 'Scatter',
    params: [['count', 'Count', 5, 800, 5, 160], ['min', 'Smallest', 8, 200, 1, 24], ['max', 'Largest', 20, 900, 5, 220], ['jitter', 'Rotation', 0, 180, 1, 45], ['mix', 'Accent mix', 0, 1, 0.01, 0.3]],
  },
};

export const LAB_ORDER = ['grid', 'radial', 'wave', 'mask', 'echo', 'scatter'];

export const labDefaults = (mode) =>
  Object.fromEntries(LAB_MODES[mode].params.map(([k, , , , , def]) => [k, def]));

const glyphsOf = (s) => {
  const list = Array.from(s.replace(/\s+/g, ''));
  return list.length ? list : ['A'];
};

/**
 * Draw a Lab piece. `ctx` is already scaled so 1 unit = 1 logical px.
 * opts: { mode, p, glyphs, word, font (CSS family stack), weight, seed, colors: { bg, ink, ink2 }, H }
 */
export function drawLab(ctx, { mode, p, glyphs, word, font, weight, seed, colors, H }) {
  const W = LAB_W;
  const rand = rng(seed);
  const chars = glyphsOf(glyphs);
  const inkFor = (mix) => (rand() < mix ? colors.ink2 : colors.ink);
  const setFont = (size) => { ctx.font = `${weight} ${size}px ${font}`; };

  ctx.save();
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const glyphAt = (ch, x, y, size, rot, color) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rot * Math.PI) / 180);
    setFont(size);
    ctx.fillStyle = color;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  };

  if (mode === 'grid') {
    const cell = W / p.cols;
    const rows = Math.ceil(H / cell);
    const yOff = (H - rows * cell) / 2;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < p.cols; c += 1) {
        const i = r * p.cols + c;
        const size = cell * p.scale * (1 + (rand() - 0.5) * 2 * p.sizeJitter);
        const rot = (r + c) * p.twist + (rand() - 0.5) * 2 * p.jitter;
        glyphAt(chars[i % chars.length], c * cell + cell / 2, yOff + r * cell + cell / 2, size, rot, inkFor(p.mix));
      }
    }
  } else if (mode === 'radial') {
    const cx = W / 2;
    const cy = H / 2;
    const maxR = Math.min(W, H) / 2;
    let i = 0;
    for (let ring = 1; ring <= p.rings; ring += 1) {
      const radius = (ring / (p.rings + 0.4)) * maxR;
      const size = (maxR / (p.rings + 1)) * p.scale;
      const count = Math.max(3, Math.floor((Math.PI * 2 * radius) / (size * p.spacing)));
      for (let n = 0; n < count; n += 1) {
        const a = (n / count) * Math.PI * 2 + (ring * p.spin * Math.PI) / 180;
        glyphAt(chars[i % chars.length], cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, size, (a * 180) / Math.PI + 90, inkFor(p.mix));
        i += 1;
      }
    }
    glyphAt(chars[0], cx, cy, (maxR / (p.rings + 1)) * p.scale * 1.6, 0, colors.ink2);
  } else if (mode === 'wave') {
    const rowH = H / p.rows;
    const size = rowH * 0.8;
    let i = 0;
    for (let r = 0; r < p.rows; r += 1) {
      const color = inkFor(p.mix);
      const baseY = r * rowH + rowH / 2;
      let x = -size;
      while (x < W + size) {
        const ch = chars[i % chars.length];
        setFont(size);
        const w = ctx.measureText(ch).width || size * 0.5;
        const t = (x / W) * Math.PI * 2 * p.freq + r * p.phase;
        const y = baseY + Math.sin(t) * p.amp;
        const slope = Math.cos(t) * p.amp * ((Math.PI * 2 * p.freq) / W);
        glyphAt(ch, x + w / 2, y, size, (Math.atan(slope) * 180) / Math.PI, color);
        x += w + size * 0.05;
        i += 1;
      }
    }
  } else if (mode === 'mask') {
    const canvasW = ctx.canvas.width;
    const canvasH = ctx.canvas.height;
    const k = canvasW / W;
    const pattern = document.createElement('canvas');
    pattern.width = canvasW;
    pattern.height = canvasH;
    const pc = pattern.getContext('2d');
    pc.scale(k, k);
    pc.textAlign = 'center';
    pc.textBaseline = 'middle';
    // A rotated field of small glyphs, then kept only inside the word.
    pc.translate(W / 2, H / 2);
    pc.rotate((p.angle * Math.PI) / 180);
    const span = Math.hypot(W, H);
    let i = 0;
    for (let y = -span / 2; y < span / 2; y += p.density * 1.1) {
      for (let x = -span / 2; x < span / 2; x += p.density * 0.9) {
        pc.font = `${weight} ${p.density}px ${font}`;
        pc.fillStyle = inkFor(p.mix);
        pc.fillText(chars[i % chars.length], x, y);
        i += 1;
      }
    }
    pc.setTransform(k, 0, 0, k, 0, 0);
    pc.globalCompositeOperation = 'destination-in';
    pc.font = `${weight} ${p.wordSize}px ${font}`;
    pc.fillStyle = '#000';
    const lines = (word || 'Aa').split('\n');
    lines.forEach((ln, li) => {
      pc.fillText(ln, W / 2, H / 2 + (li - (lines.length - 1) / 2) * p.wordSize * 0.9);
    });

    if (p.ghost > 0) {
      ctx.globalAlpha = p.ghost;
      setFont(p.wordSize);
      ctx.fillStyle = colors.ink;
      lines.forEach((ln, li) => ctx.fillText(ln, W / 2, H / 2 + (li - (lines.length - 1) / 2) * p.wordSize * 0.9));
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(pattern, 0, 0);
    ctx.restore();
  } else if (mode === 'echo') {
    const text = word || 'Echo';
    for (let n = p.copies - 1; n >= 0; n -= 1) {
      const size = p.size * Math.max(0.05, 1 - n * p.shrink);
      const x = W / 2 + (n - (p.copies - 1) / 2) * p.dx;
      const y = H / 2 + (n - (p.copies - 1) / 2) * p.dy;
      setFont(size);
      ctx.lineJoin = 'round';
      if (n === 0) {
        ctx.fillStyle = colors.ink2;
        ctx.fillText(text, x, y);
      } else if (p.outline > 0) {
        ctx.lineWidth = p.outline;
        ctx.strokeStyle = colors.ink;
        ctx.globalAlpha = Math.max(0.1, 1 - n / p.copies);
        ctx.strokeText(text, x, y);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = n % 2 ? colors.ink : colors.bg;
        ctx.fillText(text, x, y);
      }
    }
  } else if (mode === 'scatter') {
    const lo = Math.min(p.min, p.max);
    const hi = Math.max(p.min, p.max);
    for (let n = 0; n < p.count; n += 1) {
      const size = lo + Math.pow(rand(), 2.2) * (hi - lo);
      glyphAt(chars[Math.floor(rand() * chars.length)], rand() * W, rand() * H, size, (rand() - 0.5) * 2 * p.jitter, inkFor(p.mix));
    }
  }
  ctx.restore();
}
