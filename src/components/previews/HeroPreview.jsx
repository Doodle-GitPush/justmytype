import { SAMPLE } from '../../data/content';
import { useTypeReveal, useSoftReveal } from '../../hooks/useTypeReveal';

/**
 * A real landing-page hero — eyebrow, headline, subtext, two buttons — with
 * none of the mockup chrome (browser frame, nav bar, feature grid, footer)
 * the previous version wrapped it in. That was a whole fake site; this is
 * just the part that actually shows off a type pair in a hero context.
 */
export default function HeroPreview({ pStyle, sStyle, text, revealKey }) {
  const headingRef = useTypeReveal({
    type: 'lines',
    animate: 'lines',
    stagger: 0.1,
    deps: [revealKey],
  });

  const bodyRef = useSoftReveal({ deps: [revealKey], delay: 0.35 });
  const headline = text || SAMPLE.heroTitle;

  return (
    <div
      ref={bodyRef}
      className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-[720px] mx-auto min-h-0"
    >
      <span
        data-reveal
        className="text-[12px] font-semibold tracking-[0.15em] uppercase text-primary mb-5"
        style={{ fontFamily: sStyle.fontFamily }}
      >
        Introducing v2.0
      </span>

      <h1
        key={headline}
        ref={headingRef}
        className="text-[clamp(40px,6.5vw,68px)] font-bold tracking-tight text-foreground leading-[1.08] mb-6 [text-wrap:balance]"
        style={pStyle}
      >
        {headline}
      </h1>

      <p
        data-reveal
        className="text-[clamp(16px,2vw,19px)] text-muted-foreground leading-relaxed max-w-[540px] mb-10"
        style={sStyle}
      >
        {SAMPLE.heroSub}
      </p>

      <div data-reveal className="flex items-center gap-3">
        <button
          className="h-12 px-7 rounded-full bg-primary text-primary-foreground text-[15px] font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
          style={{ fontFamily: sStyle.fontFamily }}
        >
          Get Started
        </button>
        <button
          className="h-12 px-7 rounded-full border border-border text-foreground text-[15px] font-semibold hover:bg-muted active:scale-95 transition-all"
          style={{ fontFamily: sStyle.fontFamily }}
        >
          Learn More
        </button>
      </div>
    </div>
  );
}
