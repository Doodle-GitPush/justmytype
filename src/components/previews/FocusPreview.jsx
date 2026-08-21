import { useRef, useState } from 'react';
import { gsap, useGSAP, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';
import { SAMPLE } from '../../data/content';
import { stack } from '../../lib/typeStyles';

/**
 * Big centered display type is the whole point of this view, so its size
 * has to answer to the text length, not the size slider — a pasted
 * paragraph and a single word can't share one clamp.
 */
const sizeFor = (len) => {
  if (len > 70) return 'clamp(20px,4vw,44px)';
  if (len > 40) return 'clamp(26px,5.5vw,64px)';
  if (len > 20) return 'clamp(32px,7vw,96px)';
  return 'clamp(44px,10.5vw,168px)';
};

export default function FocusPreview({ primaryFont, secondaryFont, pControls, sControls, text, revealKey, bodyLineHeight, onTextChange }) {
  const wordRef = useRef(null);
  const subRef = useRef(null);

  // What's actually painted right now — lags the incoming props until a
  // blur-out has something real to fade away from before swapping in.
  const [shown, setShown] = useState({
    text, primaryFont, secondaryFont,
    pWeight: pControls.weight, sWeight: sControls.weight,
  });
  const firstRun = useRef(true);
  const prevRevealKey = useRef(revealKey);

  useGSAP(
    () => {
      const els = [wordRef.current, subRef.current].filter(Boolean);
      if (!els.length) return;

      const sync = () => {
        setShown({
          text, primaryFont, secondaryFont,
          pWeight: pControls.weight, sWeight: sControls.weight,
        });
        // The headline owns its own DOM text while it's being typed into
        // directly — writing it back from state mid-edit would reset the
        // cursor to the start on every keystroke. Only push external
        // changes (dock edits, Generate Pair, initial mount) into it.
        if (wordRef.current && document.activeElement !== wordRef.current) {
          wordRef.current.textContent = text;
        }
      };

      // First paint: blur straight in, nothing to blur out from.
      if (firstRun.current) {
        firstRun.current = false;
        prevRevealKey.current = revealKey;
        sync();
        if (prefersReducedMotion()) { gsap.set(els, { opacity: 1, filter: 'blur(0px)' }); return; }
        gsap.fromTo(
          els,
          { opacity: 0, filter: 'blur(20px)' },
          { opacity: 1, filter: 'blur(0px)', duration: DUR.slow, ease: EASE.out, stagger: 0.08 }
        );
        return;
      }

      // Only a real pairing change (Generate Pair) gets the blur transition.
      // Typing, a manual font pick, or a weight tweak should land instantly —
      // re-blurring on every keystroke would fight the person mid-type.
      const isRegenerate = revealKey !== prevRevealKey.current;
      prevRevealKey.current = revealKey;

      if (!isRegenerate || prefersReducedMotion()) {
        sync();
        if (prefersReducedMotion()) gsap.set(els, { opacity: 1, filter: 'blur(0px)' });
        return;
      }

      gsap.to(els, {
        opacity: 0,
        filter: 'blur(20px)',
        duration: DUR.fast,
        ease: EASE.in,
        overwrite: 'auto',
        onComplete: () => {
          sync();
          gsap.fromTo(
            els,
            { opacity: 0, filter: 'blur(20px)' },
            { opacity: 1, filter: 'blur(0px)', duration: DUR.base, ease: EASE.out, stagger: 0.06, overwrite: 'auto' }
          );
        },
      });
    },
    { dependencies: [text, primaryFont, secondaryFont, pControls.weight, sControls.weight, revealKey] }
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-8 min-h-0">
      <div
        ref={wordRef}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        role="textbox"
        aria-label="Preview text"
        title="Click to edit"
        onInput={(e) => onTextChange?.(e.currentTarget.textContent)}
        onKeyDown={(e) => {
          // Plain line break, not a nested <div> — keeps textContent (and
          // sizeFor's length check) reading the same plain string the dock
          // textarea would produce for the same input.
          if (e.key === 'Enter') {
            e.preventDefault();
            document.execCommand('insertLineBreak');
          }
        }}
        className="max-w-[1100px] tracking-tight text-foreground [text-wrap:balance] hyphens-none outline-none cursor-text rounded-lg transition-shadow focus:ring-2 focus:ring-primary/40"
        style={{
          fontFamily: stack(shown.primaryFont),
          fontWeight: shown.pWeight,
          fontSize: sizeFor(shown.text.length),
          lineHeight: pControls.lh,
          letterSpacing: `${pControls.ls}em`,
        }}
      />

      <div
        ref={subRef}
        className="mt-5 sm:mt-7 max-w-[620px] text-muted-foreground [text-wrap:balance]"
        style={{
          fontFamily: stack(shown.secondaryFont),
          fontWeight: shown.sWeight,
          fontSize: `${sControls.size}px`,
          lineHeight: bodyLineHeight,
          letterSpacing: `${sControls.ls}em`,
        }}
      >
        {SAMPLE.lead}
      </div>
    </div>
  );
}
