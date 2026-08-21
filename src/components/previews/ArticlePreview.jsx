import { Heart, MessageCircle, Bookmark } from 'lucide-react';
import { SAMPLE } from '../../data/content';
import { useTypeReveal, useSoftReveal } from '../../hooks/useTypeReveal';

export default function ArticlePreview({ pStyle, sStyle, text, revealKey }) {
  // Deliberately not keyed on `text`: re-splitting on every keystroke would
  // replay the reveal while the user is still typing. The heading's `key`
  // keeps the DOM correct; the animation only replays on a new pairing.
  const headingRef = useTypeReveal({
    type: 'lines',
    animate: 'lines',
    stagger: 0.09,
    deps: [revealKey],
  });

  const bodyRef = useSoftReveal({ deps: [revealKey], delay: 0.25 });

  // Subheads carry the primary font, same as the headline — only its size
  // and line-height are overridden here, by the section's own Tailwind
  // classes rather than pStyle's, so they read as a hierarchy of headline
  // sizes instead of all matching the H1 exactly.
  const subheadStyle = { fontFamily: pStyle.fontFamily, fontWeight: pStyle.fontWeight, letterSpacing: pStyle.letterSpacing };

  return (
    <div ref={bodyRef} className="max-w-[680px] mx-auto w-full px-1 lg:px-0 py-2 lg:py-8">
      <h1
        key={text}
        ref={headingRef}
        className="text-[32px] lg:text-[42px] font-bold tracking-tight text-foreground leading-[1.15] mb-4"
        style={pStyle}
      >
        {text}
      </h1>

      <p data-reveal className="text-lg lg:text-xl text-muted-foreground/90 leading-snug mb-6" style={sStyle}>
        {SAMPLE.lead}
      </p>

      {/* Byline — the one chrome element every Medium piece carries, which
          is exactly what a boxed "Featured" badge never read as. */}
      <div data-reveal className="flex items-center gap-3 py-4 border-y border-border mb-10">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-[15px] shrink-0">
          AR
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[14px] font-semibold text-foreground">Alex Rivera</span>
          <span className="text-[13px] text-muted-foreground">6 min read · Editorial</span>
        </div>
      </div>

      <div className="text-foreground text-[18px] lg:text-[19px] leading-[1.7]" style={sStyle}>
        <p data-reveal>{SAMPLE.body1}</p>

        <blockquote data-reveal className="my-8 border-l-2 border-foreground pl-6 italic text-[22px] lg:text-[24px] leading-snug text-foreground">
          {SAMPLE.quote}
        </blockquote>

        <h2
          data-reveal
          className="text-[26px] lg:text-[28px] font-bold tracking-tight mt-10 mb-4 text-foreground leading-tight"
          style={subheadStyle}
        >
          The Anatomy of Type
        </h2>

        <p data-reveal className="mt-6">{SAMPLE.body2}</p>

        <h3
          data-reveal
          className="text-[21px] lg:text-[22px] font-bold tracking-tight mt-8 mb-3 text-foreground leading-tight"
          style={subheadStyle}
        >
          Principles of Pairing
        </h3>

        <ul data-reveal className="my-6 ml-6 list-disc [&>li]:mt-2">
          <li><strong>Contrast is key:</strong> Pair a serif with a sans-serif for distinct hierarchy.</li>
          <li><strong>Match x-heights:</strong> Fonts with similar lowercase heights often feel harmonious.</li>
          <li><strong>Avoid overwhelming similarity:</strong> If two fonts are too close, they clash rather than complement.</li>
        </ul>

        <p data-reveal className="mt-6">{SAMPLE.body3} {SAMPLE.body4}</p>
      </div>

      {/* Engagement row — purely decorative, but it's the detail that makes
          the layout read as an actual article rather than a text sample. */}
      <div data-reveal className="flex items-center justify-between mt-12 pt-6 border-t border-border text-muted-foreground">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 text-[13px]"><Heart size={18} /> 128</span>
          <span className="flex items-center gap-1.5 text-[13px]"><MessageCircle size={18} /> 12</span>
        </div>
        <Bookmark size={18} />
      </div>
    </div>
  );
}
