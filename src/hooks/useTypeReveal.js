import { useRef } from 'react';
import { gsap, useGSAP, SplitText, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';

/**
 * Reveals text by splitting it into lines/words/chars and staggering them in.
 *
 * Splitting depends on the rendered font — line breaks land in different places
 * once the webfont swaps in — so this relies on SplitText's `autoSplit`, which
 * re-splits (and re-runs `onSplit`) when fonts finish loading and on resize.
 *
 * Everything is created synchronously so `useGSAP`'s context owns it; building
 * tweens inside an async callback escapes that context, and a later revert then
 * strands elements at their `from` state instead of restoring them.
 */
export function useTypeReveal({
  type = 'lines',
  animate = 'lines',
  stagger = 0.07,
  duration = DUR.type,
  ease = EASE.type,
  yPercent = 110,
  delay = 0,
  deps = [],
  enabled = true,
} = {}) {
  const scope = useRef(null);

  useGSAP(
    () => {
      if (!enabled) return;
      const el = scope.current;
      if (!el) return;

      // Reduced motion still gets the content, just without the choreography.
      if (prefersReducedMotion()) {
        gsap.set(el, { opacity: 1 });
        return;
      }

      const split = SplitText.create(el, {
        type,
        mask: animate === 'lines' ? 'lines' : undefined,
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self[animate], { yPercent, opacity: 0, duration, ease, stagger, delay }),
      });

      return () => split.revert();
    },
    { scope, dependencies: deps, revertOnUpdate: true }
  );

  return scope;
}

/**
 * A lighter reveal for supporting copy — no splitting, just a soft rise.
 * Cheap enough to use on many elements at once.
 */
export function useSoftReveal({ deps = [], stagger = 0.06, delay = 0, selector = '[data-reveal]' } = {}) {
  const scope = useRef(null);

  useGSAP(
    () => {
      const targets = scope.current?.querySelectorAll(selector);
      if (!targets?.length) return;

      if (prefersReducedMotion()) {
        gsap.set(targets, { opacity: 1, y: 0 });
        return;
      }

      gsap.from(targets, {
        opacity: 0,
        y: 18,
        duration: DUR.slow,
        ease: EASE.out,
        stagger,
        delay,
      });
    },
    { scope, dependencies: deps, revertOnUpdate: true }
  );

  return scope;
}
