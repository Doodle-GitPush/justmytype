import { useTypeReveal, useSoftReveal } from '../../hooks/useTypeReveal';
import { stack } from '../../lib/typeStyles';

/**
 * Big centered display type is the whole point of this view, so its size
 * has to answer to the text length, not the size slider — a pasted
 * paragraph and a single word can't share one clamp.
 */
const sizeFor = (len) => {
  if (len > 70) return 'clamp(20px,4.5vw,48px)';
  if (len > 40) return 'clamp(26px,6vw,72px)';
  if (len > 20) return 'clamp(34px,8vw,110px)';
  return 'clamp(48px,12vw,190px)';
};

export default function FocusPreview({ sStyle, primaryFont, secondaryFont, pControls, text, revealKey }) {
  // Caption fades in once the big word has mostly finished revealing.
  const captionScope = useSoftReveal({ deps: [revealKey], delay: 0.85 });

  // words,chars keeps character boundaries inside words, so a long family
  // name or phrase can't break mid-word the way a bare 'chars' split would
  // (see PosterPreview — same fix, same reason).
  const typeScope = useTypeReveal({
    type: 'words,chars',
    animate: 'chars',
    mask: 'chars',
    stagger: 0.026,
    duration: 0.95,
    yPercent: 115,
    deps: [revealKey],
  });

  return (
    <div ref={captionScope} className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-8 min-h-0">
      <div
        // SplitText owns this node's children once it splits; key it on the
        // text so an edit remounts cleanly instead of fighting React's
        // reconciliation over spans it doesn't know about.
        key={text}
        ref={typeScope}
        className="max-w-[1100px] leading-[0.98] tracking-tight text-foreground [text-wrap:balance] hyphens-none"
        style={{ fontFamily: stack(primaryFont), fontWeight: pControls.weight, fontSize: sizeFor(text.length) }}
      >
        {text}
      </div>

      <div
        data-reveal
        className="mt-6 sm:mt-8 text-[11px] sm:text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
        style={{ fontFamily: sStyle.fontFamily }}
      >
        {primaryFont} <span className="opacity-50">+</span> {secondaryFont}
      </div>
    </div>
  );
}
