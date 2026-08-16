import { useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { gsap, useGSAP, SplitText, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';
import { FONT_METADATA } from '../../data/fonts';
import { stack } from '../../lib/typeStyles';

const metaFor = (family) => FONT_METADATA.find((m) => m.family === family);

/**
 * A full-bleed typographic poster — the mode that exists purely to show the
 * pairing off. One GSAP timeline drives the whole composition so the rules,
 * the display type and the supporting copy land in a deliberate order.
 */
export default function PosterPreview({ primaryFont, secondaryFont, pControls, sControls, text }) {
  const scope = useRef(null);
  const [replay, setReplay] = useState(0);

  const pMeta = metaFor(primaryFont);
  const sMeta = metaFor(secondaryFont);

  // Headline weight, clamped to something the family can actually render.
  const displayWeight = pMeta?.weights?.length
    ? pMeta.weights.reduce((best, w) => (Math.abs(w - 800) < Math.abs(best - 800) ? w : best))
    : pControls.weight;

  // Long family names ("Playwrite AU QLD Guides") need a smaller cap or they
  // break mid-word across three lines.
  const displaySize =
    primaryFont.length > 22 ? 'clamp(28px,6vw,68px)'
      : primaryFont.length > 14 ? 'clamp(34px,8vw,100px)'
        : 'clamp(40px,11vw,150px)';

  useGSAP(
    () => {
      const q = gsap.utils.selector(scope);

      if (prefersReducedMotion()) {
        gsap.set(q('[data-poster]'), { opacity: 1, scaleX: 1, yPercent: 0 });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: EASE.out } });

      // Rules draw in from the left…
      tl.fromTo(
        q('[data-rule]'),
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: DUR.slow, stagger: 0.08 },
        0
      )
        .from(q('[data-eyebrow]'), { opacity: 0, y: 14, duration: DUR.base, stagger: 0.08 }, 0.15)
        .from(q('[data-poster-body]'), { opacity: 0, y: 22, duration: DUR.slow, stagger: 0.1 }, 0.55)
        .from(q('[data-glyph]'), { opacity: 0, y: 12, duration: DUR.base, stagger: 0.012 }, 0.7);

      // Font names scramble into place — a small nod to printed type specimens.
      q('[data-scramble]').forEach((el, i) => {
        tl.to(
          el,
          {
            duration: 1.1,
            scrambleText: {
              text: el.dataset.scramble,
              chars: 'upperAndLowerCase',
              speed: 0.4,
              revealDelay: 0.3,
            },
          },
          0.5 + i * 0.12
        );
      });

      // The display type rises out of its mask, character by character.
      // `autoSplit` re-runs this once the webfont actually lands.
      const split = SplitText.create(q('[data-display]'), {
        // 'words' matters even though we animate chars: splitting to chars alone
        // makes every character its own break opportunity, so long family names
        // wrap mid-word ("Plus Jaka / rta Sans").
        type: 'words,chars',
        mask: 'chars',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.chars, {
            yPercent: 115,
            duration: 1,
            ease: EASE.type,
            stagger: { each: 0.035, from: 'start' },
          }),
      });

      return () => split.revert();
    },
    { scope, dependencies: [primaryFont, secondaryFont, text, replay], revertOnUpdate: true }
  );

  return (
    <div
      ref={scope}
      className="w-full max-w-[1100px] mx-auto bg-card border border-border rounded-[20px] lg:rounded-[28px] overflow-hidden shadow-sm relative"
    >
      {/* Replay affordance — bottom-left, clear of the floating action bar */}
      <button
        onClick={() => setReplay((n) => n + 1)}
        className="absolute bottom-4 right-4 z-20 flex items-center gap-2 text-[11px] font-medium text-muted-foreground hover:text-foreground bg-background/70 backdrop-blur border border-border rounded-full px-3 py-1.5 transition-all hover:scale-105 active:scale-95 duration-200"
        aria-label="Replay poster animation"
      >
        <RotateCcw size={12} />
        Replay
      </button>

      <div className="px-6 py-10 sm:px-12 sm:py-14 lg:px-16 lg:py-20 flex flex-col">
        {/* Eyebrow row */}
        <div className="flex items-center justify-between gap-4 mb-6 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <span data-eyebrow data-poster>{pMeta?.category ?? 'Custom'}</span>
          <span data-eyebrow data-poster className="text-primary">Type Specimen</span>
          <span data-eyebrow data-poster className="hidden sm:inline">
            {pMeta?.weights?.length ?? '—'} weights
          </span>
        </div>

        <div data-rule data-poster className="h-px w-full bg-border mb-8 sm:mb-10" />

        {/* The display line */}
        <div className="overflow-hidden mb-8 sm:mb-10">
          <h1
            /* SplitText replaces this node's children with per-char spans, so
               React can no longer reconcile a text change against it. Keying on
               the content forces a clean node before the next split. */
            key={primaryFont}
            data-display
            data-poster
            className="leading-[0.95] tracking-[-0.03em] text-foreground [text-wrap:balance] hyphens-none"
            style={{ fontFamily: stack(primaryFont), fontWeight: displayWeight, fontSize: displaySize }}
          >
            {primaryFont}
          </h1>
        </div>

        <div data-rule data-poster className="h-px w-full bg-border mb-8 sm:mb-10" />

        {/* Supporting composition */}
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 sm:gap-12 mb-10 sm:mb-14">
          <p
            data-poster-body
            data-poster
            className="text-[clamp(16px,2.2vw,26px)] text-foreground max-w-[46ch]"
            style={{
              fontFamily: stack(secondaryFont),
              fontWeight: sControls.weight,
              lineHeight: 1.45,
              letterSpacing: `${sControls.ls}em`,
            }}
          >
            {text}
          </p>

          <dl
            data-poster-body
            data-poster
            className="flex flex-col gap-4 text-[13px] self-end"
            style={{ fontFamily: stack(secondaryFont) }}
          >
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Display</dt>
              <dd
                data-scramble={primaryFont}
                className="text-foreground font-medium text-[15px] truncate"
              >
                {primaryFont}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Text</dt>
              <dd
                data-scramble={secondaryFont}
                className="text-foreground font-medium text-[15px] truncate"
              >
                {secondaryFont}
              </dd>
            </div>
            <div className="flex gap-6 pt-2 border-t border-border/60">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Style</span>
                <span className="text-foreground text-[13px]">{sMeta?.category ?? 'Custom'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Italic</span>
                <span className="text-foreground text-[13px]">{sMeta?.hasItalic ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </dl>
        </div>

        {/* Glyph strip, set in the display face */}
        <div
          className="flex flex-wrap gap-x-3 gap-y-1 text-[clamp(15px,2vw,24px)] text-muted-foreground/70 leading-tight"
          style={{ fontFamily: stack(primaryFont) }}
          aria-label="Glyph set"
        >
          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').map((c, i) => (
            <span data-glyph data-poster key={`${c}-${i}`}>
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
