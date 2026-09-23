import { gsap } from './gsap';

const TAU = Math.PI * 2;

/**
 * Continuous kinetic-typography effects for Animate.
 *
 * Unlike a one-shot entrance, these run for as long as their effect is
 * selected. Each `build(chars, wordEl, p, stage)` receives the split
 * characters, the word element that holds them, the effect's current
 * parameter values and the stage element, and returns something with a
 * `.kill()` — a tween, a timeline, or a small handle — so the caller can
 * tear it down the moment the effect or a parameter changes. Speed is
 * applied by the caller via `timeScale`, so it isn't repeated per effect.
 *
 * `params` describes each knob for the UI: [key, label, min, max, step, default].
 */

// A gentle S-curve, in relative offsets from each character's resting
// spot, scaled by the amplitude parameter — a ripple riding on top of the
// layout, never wide enough to send letters through their neighbours.
const ripplePath = (amp) => [
  { x: 0, y: 0 },
  { x: amp / 3, y: -amp },
  { x: (amp * 2) / 3, y: 0 },
  { x: amp, y: amp },
  { x: (amp * 4) / 3, y: 0 },
];

const handle = (...parts) => ({
  kill: () => parts.forEach((t) => t?.kill?.()),
  timeScale: (v) => parts.forEach((t) => t?.timeScale?.(v)),
});

export const KINETIC_EFFECTS = {
  circle: {
    label: 'Circle',
    params: [['radius', 'Radius', 0.5, 2.5, 0.05, 1], ['spin', 'Spin time', 4, 40, 1, 16]],
    build: (chars, wordEl, p, stage) => {
      const n = chars.length;
      // Circumference from the letters' real set width (measured before
      // they're pulled out of flow), so long lines don't pile up on
      // themselves and short words don't float in a huge empty ring.
      const setWidth = chars.reduce((w, c) => w + c.offsetWidth, 0) * 1.25;
      const radius = Math.max(90, setWidth / TAU) * p.radius;
      const size = radius * 2 + 80;
      // Shrink the whole ring to fit the canvas rather than crop it.
      const room = stage ? Math.min(stage.clientWidth, stage.clientHeight) * 0.92 : size;
      gsap.set(wordEl, { width: size, height: size, scale: Math.min(1, room / size), transformOrigin: '50% 50%' });
      gsap.set(chars, { position: 'absolute', left: '50%', top: '50%', xPercent: -50, yPercent: -50 });
      chars.forEach((char, i) => {
        const angle = (i / n) * TAU - Math.PI / 2;
        gsap.set(char, {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          rotation: (angle * 180) / Math.PI + 90,
        });
      });
      // Rotating the shared parent — not each letter — makes the whole
      // ring orbit together instead of each character spinning in place.
      return gsap.to(wordEl, { rotation: 360, duration: p.spin, repeat: -1, ease: 'none' });
    },
  },
  path: {
    label: 'Ripple',
    params: [['amp', 'Amplitude', 3, 40, 1, 9], ['stagger', 'Stagger', 0.02, 0.3, 0.01, 0.09]],
    build: (chars, _w, p) => {
      gsap.set(chars, { transformOrigin: '50% 50%' });
      // No autoRotate: yoyo reverses the path direction instantly at each
      // end, which would flip the tangent (and the letter) 180° in a frame.
      return gsap.to(chars, {
        motionPath: { path: ripplePath(p.amp), curviness: 1.4 },
        duration: 2.4,
        ease: 'sine.inOut',
        stagger: { each: p.stagger, repeat: -1, yoyo: true },
      });
    },
  },
  wave: {
    label: 'Wave',
    params: [['height', 'Height', 4, 90, 1, 18], ['stagger', 'Stagger', 0.01, 0.2, 0.01, 0.05]],
    build: (chars, _w, p) => {
      gsap.set(chars, { transformOrigin: '50% 50%' });
      return gsap.to(chars, {
        y: -p.height,
        duration: 0.55,
        ease: 'sine.inOut',
        stagger: { each: p.stagger, repeat: -1, yoyo: true },
      });
    },
  },
  typewriter: {
    label: 'Typewriter',
    params: [['pace', 'Per letter', 0.02, 0.3, 0.01, 0.07], ['hold', 'Hold', 0.2, 4, 0.1, 1.4]],
    build: (chars, _w, p) => {
      const tl = gsap.timeline({ repeat: -1 });
      tl.set(chars, { opacity: 0 })
        .to(chars, { opacity: 1, duration: 0.01, stagger: p.pace })
        .to(chars, { opacity: 0, duration: 0.25, delay: p.hold, stagger: { each: 0.015, from: 'end' } })
        .to({}, { duration: 0.3 });
      return tl;
    },
  },
  scramble: {
    label: 'Scramble',
    params: [['duration', 'Duration', 0.2, 2, 0.05, 0.6], ['calm', 'Calm', 0, 4, 0.1, 1.2]],
    build: (chars, _w, p) => {
      const tweens = chars.map((char) => {
        const original = char.textContent;
        if (!original.trim()) return null;
        return gsap.to(char, {
          scrambleText: { text: original, chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*', speed: 0.6 },
          duration: p.duration,
          repeat: -1,
          repeatDelay: p.calm + Math.random() * p.calm,
          delay: Math.random() * (p.calm + 0.5),
        });
      });
      return handle(...tweens);
    },
  },
  glitch: {
    label: 'Glitch',
    params: [['intensity', 'Intensity', 1, 40, 1, 10], ['rate', 'Rate', 0.03, 0.5, 0.01, 0.09]],
    build: (chars, _w, p) => {
      const tl = gsap.timeline({ repeat: -1, repeatRefresh: true });
      tl.to(chars, {
        x: () => gsap.utils.random(-p.intensity, p.intensity),
        y: () => gsap.utils.random(-p.intensity / 3, p.intensity / 3),
        skewX: () => gsap.utils.random(-p.intensity, p.intensity),
        opacity: () => (Math.random() < 0.12 ? 0.25 : 1),
        duration: p.rate,
        ease: 'steps(1)',
        stagger: { each: 0.004, from: 'random' },
      }).to(chars, { x: 0, y: 0, skewX: 0, opacity: 1, duration: p.rate, ease: 'steps(1)' })
        .to({}, { duration: () => gsap.utils.random(0.1, 0.9) });
      return tl;
    },
  },
  scatter: {
    label: 'Scatter',
    params: [['distance', 'Distance', 40, 600, 10, 220], ['spin', 'Rotation', 0, 720, 10, 180]],
    build: (chars, _w, p) => {
      const tl = gsap.timeline({ repeat: -1, repeatRefresh: true, repeatDelay: 0.8 });
      tl.to(chars, {
        x: () => gsap.utils.random(-p.distance, p.distance),
        y: () => gsap.utils.random(-p.distance, p.distance) * 0.6,
        rotation: () => gsap.utils.random(-p.spin, p.spin),
        opacity: 0.15,
        duration: 1.1,
        ease: 'power3.in',
        stagger: { each: 0.02, from: 'random' },
      }).to(chars, {
        x: 0, y: 0, rotation: 0, opacity: 1,
        duration: 1.2,
        ease: 'expo.out',
        stagger: { each: 0.02, from: 'random' },
      });
      return tl;
    },
  },
  flip: {
    label: 'Flip',
    params: [['stagger', 'Stagger', 0.01, 0.3, 0.01, 0.06], ['pause', 'Pause', 0, 3, 0.1, 0.8]],
    build: (chars, _w, p) => {
      gsap.set(chars, { transformOrigin: '50% 50% -10px' });
      return gsap.to(chars, {
        rotationY: 360,
        duration: 1,
        ease: 'power2.inOut',
        stagger: p.stagger,
        repeat: -1,
        repeatDelay: p.pause,
      });
    },
  },
  stretch: {
    label: 'Stretch',
    params: [['amount', 'Amount', 1.1, 3, 0.05, 1.8], ['stagger', 'Stagger', 0.01, 0.2, 0.01, 0.06]],
    build: (chars, _w, p) => {
      gsap.set(chars, { transformOrigin: '50% 100%' });
      return gsap.to(chars, {
        scaleY: p.amount,
        scaleX: 1 / Math.sqrt(p.amount),
        duration: 0.5,
        ease: 'sine.inOut',
        stagger: { each: p.stagger, repeat: -1, yoyo: true },
      });
    },
  },
  breathe: {
    label: 'Weight',
    params: [['low', 'Thinnest', 100, 900, 10, 200], ['high', 'Heaviest', 100, 1000, 10, 900], ['stagger', 'Stagger', 0, 0.3, 0.01, 0.08]],
    // Animates font-weight itself — silky on a variable font, stepped
    // through the real cuts on a static one.
    build: (chars, _w, p) => {
      gsap.set(chars, { fontWeight: p.low });
      return gsap.to(chars, {
        fontWeight: p.high,
        duration: 0.9,
        ease: 'sine.inOut',
        stagger: { each: p.stagger, repeat: -1, yoyo: true },
      });
    },
  },
  bounce: {
    label: 'Bounce',
    params: [['height', 'Drop height', 40, 600, 10, 240], ['stagger', 'Stagger', 0.01, 0.3, 0.01, 0.05]],
    build: (chars, _w, p) => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
      tl.from(chars, { y: -p.height, opacity: 0, duration: 1.1, ease: 'bounce.out', stagger: p.stagger })
        .to(chars, { y: p.height / 2, opacity: 0, duration: 0.4, ease: 'power2.in', stagger: p.stagger / 2, delay: 1 });
      return tl;
    },
  },
  magnet: {
    label: 'Magnet',
    params: [['radius', 'Reach', 40, 400, 10, 160], ['strength', 'Strength', 5, 150, 5, 60]],
    // Letters shy away from the pointer. A slow idle drift keeps it alive
    // when nobody's touching it (and in recordings made hands-off).
    build: (chars, _w, p, stage) => {
      const movers = chars.map((c) => ({
        el: c,
        x: gsap.quickTo(c, 'x', { duration: 0.5, ease: 'power3.out' }),
        y: gsap.quickTo(c, 'y', { duration: 0.5, ease: 'power3.out' }),
      }));
      let pointer = null;
      const onMove = (e) => { pointer = { x: e.clientX, y: e.clientY }; };
      const onLeave = () => { pointer = null; };
      stage?.addEventListener('pointermove', onMove);
      stage?.addEventListener('pointerleave', onLeave);

      const start = performance.now();
      const tick = () => {
        const t = (performance.now() - start) / 1000;
        // Idle: an invisible pointer sweeping across the word.
        let target = pointer;
        if (!target && stage) {
          const r = stage.getBoundingClientRect();
          target = { x: r.left + r.width * (0.5 + 0.38 * Math.sin(t * 0.9)), y: r.top + r.height * (0.5 + 0.12 * Math.sin(t * 1.7)) };
        }
        for (const m of movers) {
          const r = m.el.getBoundingClientRect();
          const cx = r.left + r.width / 2 - (gsap.getProperty(m.el, 'x') || 0);
          const cy = r.top + r.height / 2 - (gsap.getProperty(m.el, 'y') || 0);
          const dx = cx - target.x;
          const dy = cy - target.y;
          const d = Math.hypot(dx, dy) || 1;
          const push = d < p.radius ? (1 - d / p.radius) * p.strength : 0;
          m.x((dx / d) * push);
          m.y((dy / d) * push);
        }
      };
      gsap.ticker.add(tick);
      return {
        kill: () => {
          gsap.ticker.remove(tick);
          stage?.removeEventListener('pointermove', onMove);
          stage?.removeEventListener('pointerleave', onLeave);
          gsap.killTweensOf(chars);
        },
        timeScale: () => {},
      };
    },
  },
};

export const KINETIC_EFFECT_ORDER = [
  'circle', 'path', 'wave', 'typewriter', 'scramble', 'glitch',
  'scatter', 'flip', 'stretch', 'breathe', 'bounce', 'magnet',
];

/** Default parameter values for an effect. */
export const defaultParams = (key) =>
  Object.fromEntries((KINETIC_EFFECTS[key]?.params ?? []).map(([k, , , , , def]) => [k, def]));
