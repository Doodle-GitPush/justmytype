/**
 * Records Animate's live DOM animation into video, GIF or a still PNG.
 *
 * The DOM can't be captured directly, so every frame is re-drawn onto a
 * canvas: for each split character, the transforms of it and its
 * positioned ancestors are composed into one matrix (exactly what the
 * browser does to paint it), and the glyph is drawn with that matrix,
 * its computed font, colour and opacity. Webfonts already loaded into
 * the page are available to canvas too, so the export uses the real
 * typefaces. 3D rotations flatten to their 2D projection; variable-axis
 * settings other than weight can't be expressed in canvas text and fall
 * back to the font's defaults.
 */

const parseOrigin = (value) => value.split(' ').map(parseFloat);

/** Matrix mapping `el`'s local box into `frame`'s coordinate space. */
function matrixToFrame(el, frame) {
  let m = new DOMMatrix();
  let node = el;
  let opacity = 1;
  while (node && node !== frame) {
    const cs = getComputedStyle(node);
    opacity *= parseFloat(cs.opacity);
    const t = cs.transform && cs.transform !== 'none' ? new DOMMatrix(cs.transform) : new DOMMatrix();
    const [ox = 0, oy = 0] = parseOrigin(cs.transformOrigin);
    const local = new DOMMatrix()
      .translate(node.offsetLeft, node.offsetTop)
      .translate(ox, oy)
      .multiply(t)
      .translate(-ox, -oy);
    m = local.multiply(m);
    // offsetParent skips unpositioned wrappers, which never carry
    // transforms here — the positioned chain is the transform chain.
    node = node.offsetParent;
    if (!node || !frame.contains(node)) break;
  }
  return { m, opacity };
}

/** Paints one frame of `chars` (inside `frame`) onto `ctx`, scaled by `scale`. */
export function drawFrame(ctx, frame, chars, scale, background) {
  const { width, height } = ctx.canvas;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const frameOpacity = parseFloat(getComputedStyle(frame).opacity) || 1;

  for (const el of chars) {
    const text = el.textContent;
    if (!text || !text.trim()) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const { m, opacity } = matrixToFrame(el, frame);
    const alpha = opacity * frameOpacity;
    if (alpha <= 0.001) continue;

    const size = parseFloat(cs.fontSize);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    const metrics = ctx.measureText(text);
    const ascent = metrics.fontBoundingBoxAscent ?? size * 0.8;
    const descent = metrics.fontBoundingBoxDescent ?? size * 0.2;
    const boxH = el.offsetHeight;
    const baseline = (boxH - (ascent + descent)) / 2 + ascent;

    ctx.setTransform(m.a * scale, m.b * scale, m.c * scale, m.d * scale, m.e * scale, m.f * scale);
    ctx.globalAlpha = alpha;
    ctx.filter = cs.filter && cs.filter !== 'none' ? cs.filter : 'none';
    ctx.fillStyle = cs.color;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillText(text, 0, baseline);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
}

/** Output canvas sized to the frame's aspect, with its long side = `longSide`. */
function makeCanvas(frame, longSide) {
  const w = frame.offsetWidth;
  const h = frame.offsetHeight;
  const scale = longSide / Math.max(w, h);
  const canvas = document.createElement('canvas');
  // Even dimensions — H.264 encoders refuse odd ones.
  canvas.width = Math.max(2, Math.round((w * scale) / 2) * 2);
  canvas.height = Math.max(2, Math.round((h * scale) / 2) * 2);
  return { canvas, ctx: canvas.getContext('2d'), scale: canvas.width / w };
}

const bgOf = (frame) => {
  const bg = getComputedStyle(frame).backgroundColor;
  return !bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' ? '#ffffff' : bg;
};

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** The best video container this browser can record — MP4 where supported. */
export function videoFormat() {
  if (typeof MediaRecorder === 'undefined') return null;
  const options = [
    ['video/mp4;codecs=avc1', 'mp4'],
    ['video/mp4', 'mp4'],
    ['video/webm;codecs=vp9', 'webm'],
    ['video/webm', 'webm'],
  ];
  const hit = options.find(([type]) => MediaRecorder.isTypeSupported(type));
  return hit ? { mimeType: hit[0], ext: hit[1] } : null;
}

/**
 * Records `seconds` of the live animation as a video Blob.
 * `onProgress(0..1)`; `signal` (AbortSignal) cancels.
 */
export function recordVideo({ frame, getChars, seconds = 5, longSide = 1080, fps = 30, onProgress, signal }) {
  const format = videoFormat();
  if (!format) return Promise.reject(new Error('This browser can’t record video — try GIF instead.'));
  const { canvas, ctx, scale } = makeCanvas(frame, longSide);
  const background = bgOf(frame);
  drawFrame(ctx, frame, getChars(), scale, background);

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType: format.mimeType, videoBitsPerSecond: 10_000_000 });
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

  return new Promise((resolve, reject) => {
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      const elapsed = (performance.now() - start) / 1000;
      drawFrame(ctx, frame, getChars(), scale, background);
      onProgress?.(Math.min(1, elapsed / seconds));
      if (signal?.aborted) { recorder.stop(); return; }
      if (elapsed >= seconds) { recorder.stop(); return; }
      raf = requestAnimationFrame(loop);
    };
    recorder.onstop = () => {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      if (signal?.aborted) return reject(new DOMException('Cancelled', 'AbortError'));
      resolve({ blob: new Blob(chunks, { type: format.mimeType.split(';')[0] }), ext: format.ext });
    };
    recorder.onerror = (e) => reject(e.error ?? new Error('Recording failed'));
    recorder.start(250);
    raf = requestAnimationFrame(loop);
  });
}

/** Records `seconds` of the live animation as an animated GIF Blob. */
export async function recordGif({ frame, getChars, seconds = 4, longSide = 540, fps = 15, onProgress, signal }) {
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
  const { canvas, ctx, scale } = makeCanvas(frame, longSide);
  const background = bgOf(frame);
  const gif = GIFEncoder();
  const delay = Math.round(1000 / fps);
  const total = Math.round(seconds * fps);
  const start = performance.now();

  for (let i = 0; i < total; i += 1) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    // Wait for the animation's own clock to reach this frame's time.
    const due = start + i * delay;
    await new Promise((r) => requestAnimationFrame(function wait(now) {
      if (now >= due) r(); else requestAnimationFrame(wait);
    }));
    drawFrame(ctx, frame, getChars(), scale, background);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const palette = quantize(data, 256);
    gif.writeFrame(applyPalette(data, palette), width, height, { palette, delay });
    onProgress?.((i + 1) / total);
  }
  gif.finish();
  return new Blob([gif.bytes()], { type: 'image/gif' });
}

/** The current frame as a PNG Blob. */
export function snapshotPng({ frame, getChars, longSide = 2160 }) {
  const { canvas, ctx, scale } = makeCanvas(frame, longSide);
  drawFrame(ctx, frame, getChars(), scale, bgOf(frame));
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
