import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(useGSAP, SplitText, ScrollTrigger, ScrambleTextPlugin, MotionPathPlugin);

// House motion language — every animation in the app pulls from these so the
// whole product moves with one voice instead of a dozen ad-hoc easings.
export const EASE = {
  out: 'power3.out',
  in: 'power2.in',
  inOut: 'power2.inOut',
  // Type wants a softer landing than UI chrome does.
  type: 'expo.out',
  pop: 'back.out(1.7)',
};

export const DUR = {
  fast: 0.22,
  base: 0.4,
  slow: 0.7,
  type: 0.9,
};

// Respect the user's motion preference everywhere, in one place.
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

gsap.defaults({ ease: EASE.out, duration: DUR.base });

export { gsap, useGSAP, SplitText, ScrollTrigger, ScrambleTextPlugin, MotionPathPlugin };

// Dev-only handle for debugging in the browser console.
if (import.meta.env?.DEV && typeof window !== 'undefined') window.gsap = gsap;
