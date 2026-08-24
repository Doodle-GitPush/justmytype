import { gsap, EASE } from './gsap';

// A single shared swirl trajectory every character flies in along (as a
// relative x/y offset from its own resting position, ending at 0,0) —
// staggering the same path per character reads as one coherent swirl
// rather than each letter going its own separate way. Scaled by
// `intensity` below so the same shape can travel a shorter or wider arc.
const SWIRL_PATH = [
  { x: 240, y: -70 },
  { x: 60, y: 160 },
  { x: -130, y: -50 },
  { x: 0, y: 0 },
];

const scalePath = (path, intensity) => path.map((p) => ({ x: p.x * intensity, y: p.y * intensity }));

// Every preset takes the already-split characters plus { speed, intensity }
// (both default to 1, i.e. "as authored") and returns the tween that
// animates them in. `speed` divides duration/stagger — higher plays
// faster. `intensity` scales how far things travel or deform — higher
// plays bigger. Presets that don't have an obvious "distance" (Typewriter)
// only respond to speed.
export const TEXT_ANIMATIONS = {
  swirl: {
    label: 'Swirl',
    build: (chars, { speed = 1, intensity = 1 } = {}) => {
      gsap.set(chars, { transformOrigin: '50% 50%' });
      return gsap.fromTo(
        chars,
        { opacity: 0, scale: 0.3 },
        {
          opacity: 1,
          scale: 1,
          duration: 1 / speed,
          ease: EASE.type,
          stagger: 0.028 / speed,
          motionPath: { path: scalePath(SWIRL_PATH, intensity), curviness: 1.25, autoRotate: true },
        }
      );
    },
  },
  stretch: {
    label: 'Stretch',
    build: (chars, { speed = 1, intensity = 1 } = {}) => {
      gsap.set(chars, { transformOrigin: '50% 100%' });
      return gsap.fromTo(
        chars,
        { opacity: 0, scaleY: 1 - 0.85 * intensity, scaleX: 1 + 0.7 * intensity, y: 24 * intensity },
        { opacity: 1, scaleY: 1, scaleX: 1, y: 0, duration: 0.7 / speed, ease: 'elastic.out(1, 0.55)', stagger: 0.02 / speed }
      );
    },
  },
  wave: {
    label: 'Wave',
    build: (chars, { speed = 1, intensity = 1 } = {}) => {
      gsap.set(chars, { transformOrigin: '50% 100%' });
      return gsap.fromTo(
        chars,
        { opacity: 0, yPercent: 130 * intensity, rotate: -12 * intensity },
        { opacity: 1, yPercent: 0, rotate: 0, duration: 0.6 / speed, ease: 'sine.out', stagger: { each: 0.035 / speed, from: 'start' } }
      );
    },
  },
  typewriter: {
    label: 'Typewriter',
    build: (chars, { speed = 1 } = {}) =>
      gsap.fromTo(chars, { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: 0.045 / speed, ease: 'none' }),
  },
  bounce: {
    label: 'Bounce',
    build: (chars, { speed = 1, intensity = 1 } = {}) => {
      gsap.set(chars, { transformOrigin: '50% 100%' });
      return gsap.fromTo(
        chars,
        { opacity: 0, y: -80 * intensity, scale: 1 - 0.4 * intensity },
        { opacity: 1, y: 0, scale: 1, duration: 0.9 / speed, ease: 'bounce.out', stagger: 0.03 / speed }
      );
    },
  },
};

export const TEXT_ANIMATION_ORDER = ['swirl', 'stretch', 'wave', 'typewriter', 'bounce'];

// A faux-3D emboss for the stage headline — stacked 1px-offset shadows of
// falling opacity read as a beveled, extruded edge without needing WebGL
// or any real geometry. 0 = flat, 1 = fully embossed.
export const bevelTextShadow = (bevel, isDark) => {
  if (bevel <= 0) return 'none';
  const layers = Math.round(3 + bevel * 11); // 3-14 layers
  const rgb = isDark ? '0,0,0' : '30,20,10';
  const shadows = [];
  for (let i = 1; i <= layers; i++) {
    const opacity = (0.22 * (1 - i / (layers + 2))).toFixed(3);
    shadows.push(`0px ${i}px 0 rgba(${rgb},${opacity})`);
  }
  shadows.push(`0px ${layers + 4}px ${8 + bevel * 10}px rgba(${rgb},${0.28 * bevel})`);
  return shadows.join(', ');
};
