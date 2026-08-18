import { useRef, useState } from 'react';
import { gsap, useGSAP, EASE, prefersReducedMotion } from '@/lib/gsap';

const WORD = 'JustMyType';
// Hardcoded rather than pulled from the accent theme — a terminal caret is
// blue regardless of which accent colour the user picks later.
const CURSOR_BLUE = '#0a84ff';

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
        gsap.set(el, { width: `${WORD.length}ch`, borderRightColor: CURSOR_BLUE });
        setTypingDone(true);
        return;
      }

      gsap.set(el, { width: 0, borderRightColor: CURSOR_BLUE });

      gsap.to(el, {
        width: `${WORD.length}ch`,
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
        className="overflow-hidden whitespace-nowrap border-r-[3px] pr-1 font-sans text-[clamp(18px,3.6vw,28px)] tracking-tight text-foreground"
        style={{ borderRightColor: CURSOR_BLUE }}
      >
        <span className="font-medium">JustMy</span>
        <span className="font-bold">Type</span>
      </div>
    </div>
  );
}
