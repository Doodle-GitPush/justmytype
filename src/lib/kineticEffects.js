import { gsap } from './gsap';

const TAU = Math.PI * 2;

// A gentle S-curve, in relative offsets from each character's own resting
// spot — used as a shared path multiple characters travel along at once
// so the whole word ripples through the same shape rather than each
// letter inventing its own route. Kept small: this is a ripple riding on
// top of the text's normal layout, not a trip across the neighboring
// characters' own positions — the original draft's 120px horizontal
// swing was wide enough to send each letter clean through the ones next
// to it, reading as scrambled text instead of a wave.
const RIPPLE_PATH = [
  { x: 0, y: 0 },
  { x: 3, y: -9 },
  { x: 6, y: 0 },
  { x: 9, y: 9 },
  { x: 12, y: 0 },
];

/**
 * Unlike the old preset library, these don't play once and settle — they
 * run for as long as their style is selected. Each `build` returns the
 * live GSAP tween/timeline so the caller can `.kill()` it the moment the
 * style changes or the view unmounts, and takes the split characters plus
 * the word element itself (only Circle needs the second one, to rotate
 * the whole ring rather than each letter individually).
 */
export const KINETIC_EFFECTS = {
  circle: {
    label: 'Circle',
    build: (chars, wordEl) => {
      const n = chars.length;
      const radius = Math.max(90, n * 8);
      const size = radius * 2 + 80;
      gsap.set(wordEl, { position: 'relative', width: size, height: size, transformOrigin: '50% 50%' });
      gsap.set(chars, { position: 'absolute', left: '50%', top: '50%', xPercent: -50, yPercent: -50 });
      chars.forEach((char, i) => {
        const angle = (i / n) * TAU - Math.PI / 2;
        gsap.set(char, {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          rotation: (angle * 180) / Math.PI + 90,
        });
      });
      // Rotating the shared parent — not each letter — is what makes the
      // whole ring orbit together instead of each character spinning in
      // place around its own center.
      return gsap.to(wordEl, { rotation: 360, duration: 16, repeat: -1, ease: 'none' });
    },
  },
  path: {
    label: 'Path',
    build: (chars) => {
      gsap.set(chars, { transformOrigin: '50% 50%' });
      // No autoRotate here: MotionPathPlugin computes rotation from the
      // path's tangent direction, and yoyo reverses that direction
      // instantly at each end of the path — for a couple of characters,
      // right at that turnaround, the tangent (and so the rotation) flips
      // by roughly 180° in a single frame instead of easing through it,
      // which read as random letters snapping upside down mid-ripple.
      return gsap.to(chars, {
        motionPath: { path: RIPPLE_PATH, curviness: 1.4 },
        duration: 2.4,
        ease: 'sine.inOut',
        stagger: { each: 0.09, repeat: -1, yoyo: true },
      });
    },
  },
  wave: {
    label: 'Wave',
    build: (chars) => {
      gsap.set(chars, { transformOrigin: '50% 50%' });
      return gsap.to(chars, {
        y: -18,
        duration: 0.55,
        ease: 'sine.inOut',
        stagger: { each: 0.05, repeat: -1, yoyo: true },
      });
    },
  },
};

export const KINETIC_EFFECT_ORDER = ['circle', 'path', 'wave'];
