import { gsap, EASE } from './gsap';

// A single shared swirl trajectory every character flies in along (as a
// relative x/y offset from its own resting position, ending at 0,0) —
// staggering the same path per character reads as one coherent swirl
// rather than each letter going its own separate way.
const SWIRL_PATH = [
  { x: 240, y: -70 },
  { x: 60, y: 160 },
  { x: -130, y: -50 },
  { x: 0, y: 0 },
];

// Each preset only builds the entrance tween for a set of already-split
// characters — the caller (FocusPreview) owns splitting, locking the field
// while it plays, and reverting/unlocking once it's done, so every style
// gets that behavior for free without repeating it five times here.
export const TEXT_ANIMATIONS = {
  swirl: {
    label: 'Swirl',
    build: (chars) => {
      gsap.set(chars, { transformOrigin: '50% 50%' });
      return gsap.fromTo(
        chars,
        { opacity: 0, scale: 0.3 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: EASE.type,
          stagger: 0.028,
          motionPath: { path: SWIRL_PATH, curviness: 1.25, autoRotate: true },
        }
      );
    },
  },
  stretch: {
    label: 'Stretch',
    build: (chars) => {
      gsap.set(chars, { transformOrigin: '50% 100%' });
      return gsap.fromTo(
        chars,
        { opacity: 0, scaleY: 0.15, scaleX: 1.7, y: 24 },
        { opacity: 1, scaleY: 1, scaleX: 1, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.55)', stagger: 0.02 }
      );
    },
  },
  wave: {
    label: 'Wave',
    build: (chars) => {
      gsap.set(chars, { transformOrigin: '50% 100%' });
      return gsap.fromTo(
        chars,
        { opacity: 0, yPercent: 130, rotate: -12 },
        { opacity: 1, yPercent: 0, rotate: 0, duration: 0.6, ease: 'sine.out', stagger: { each: 0.035, from: 'start' } }
      );
    },
  },
  typewriter: {
    label: 'Typewriter',
    build: (chars) => gsap.fromTo(chars, { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: 0.045, ease: 'none' }),
  },
  bounce: {
    label: 'Bounce',
    build: (chars) => {
      gsap.set(chars, { transformOrigin: '50% 100%' });
      return gsap.fromTo(
        chars,
        { opacity: 0, y: -80, scale: 0.6 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'bounce.out', stagger: 0.03 }
      );
    },
  },
};

export const TEXT_ANIMATION_ORDER = ['swirl', 'stretch', 'wave', 'typewriter', 'bounce'];
