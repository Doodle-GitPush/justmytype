import { useRef, useState } from 'react';
import { gsap, useGSAP, EASE, prefersReducedMotion } from '@/lib/gsap';

const WORD = 'JustMyType';
const CURSOR_COLOR = '#FF4400';
// Extra pixels added past the measured text width so the cursor sits with a
// little breathing room after the last glyph instead of touching it.
const CURSOR_GAP = 5.5;

/**
 * Boot screen: the wordmark reveals itself through a widening clip in a
 * monospace cell, so the right edge of that clip doubles as a cursor —
 * the classic CSS typewriter technique, driven through GSAP's `steps()`
 * ease so each tick reveals exactly one character.
 *
 * Stays up until the type-in finishes AND `ready` is true, so a fast
 * connection never truncates the animation and a slow one never leaves
 * a bare word on screen with nothing appearing to happen.
 */
export default function Preloader({ ready, onFinish }) {
  const root = useRef(null);
  const typeRef = useRef(null);
  const [typingDone, setTypingDone] = useState(false);
  const exitStarted = useRef(false);

  // Type-in + caret blink.
  useGSAP(
    () => {
      const el = typeRef.current;
      if (!el) return;

      if (prefersReducedMotion()) {
        gsap.set(el, { borderRightColor: CURSOR_COLOR });
        setTypingDone(true);
        return;
      }

      // `ch` is the width of "0" in the current font — a fine stand-in for
      // a monospace face, but Wanted Sans is proportional, so it landed the
      // cursor short or past the real last glyph. Measuring the element's
      // own natural width before clipping it keeps the two in sync.
      const fullWidth = el.scrollWidth + CURSOR_GAP;
      gsap.set(el, { width: 0, borderRightColor: CURSOR_COLOR });

      gsap.to(el, {
        width: fullWidth,
        duration: 0.55,
        ease: `steps(${WORD.length})`,
        onComplete: () => setTypingDone(true),
      });

      // A snap on/off toggle, not a fade — like a real caret.
      gsap.to(el, {
        borderRightColor: 'transparent',
        duration: 0.5,
        ease: 'steps(1)',
        repeat: -1,
        yoyo: true,
      });
    },
    { scope: root }
  );

  // Exit once both the animation and the real asset load are done.
  useGSAP(
    () => {
      if (!typingDone || !ready || exitStarted.current) return;
      exitStarted.current = true;

      const reduced = prefersReducedMotion();
      const el = root.current;

      gsap.delayedCall(reduced ? 0 : 0.15, () => {
        if (!el || reduced) {
          onFinish();
          return;
        }
        gsap.to(el, {
          opacity: 0,
          scale: 1.02,
          duration: 0.35,
          ease: EASE.in,
          onComplete: onFinish,
        });
      });
    },
    { dependencies: [typingDone, ready] }
  );

  return (
    <div
      ref={root}
      role="status"
      aria-live="polite"
      aria-label="Loading JustMyType"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
    >
      <div
        ref={typeRef}
        className="overflow-hidden whitespace-nowrap border-r-[6px] font-sans text-[clamp(18px,3.6vw,28px)] tracking-tight text-foreground"
        style={{ borderRightColor: CURSOR_COLOR }}
      >
        <span className="font-medium">JustMy</span>
        <span className="font-bold">Type</span>
      </div>
    </div>
  );
}
