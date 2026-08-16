import { SAMPLE } from '../../data/content';
import { useTypeReveal, useSoftReveal } from '../../hooks/useTypeReveal';

export default function ArticlePreview({ pStyle, sStyle, pControls, text, revealKey }) {
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

  return (
    <div
      ref={bodyRef}
      className="max-w-[760px] mx-auto bg-card border border-border rounded-[20px] lg:rounded-[26px] py-8 px-6 lg:py-14 lg:px-16 shadow-sm w-full"
    >
      <div className="mb-8">
        <span
          data-reveal
          className="inline-block bg-primary/10 text-primary text-[12px] font-semibold tracking-wider py-1.5 px-3 rounded-full mb-6 uppercase"
        >
          Featured Typography
        </span>
        <h1
          key={text}
          ref={headingRef}
          className="scroll-m-20 text-3xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] lg:leading-tight"
          style={pStyle}
        >
          {text}
        </h1>
      </div>

      <p data-reveal className="text-xl text-muted-foreground mb-8" style={sStyle}>
        {SAMPLE.lead}
      </p>

      <p data-reveal className="leading-7 [&:not(:first-child)]:mt-6 text-foreground" style={sStyle}>
        {SAMPLE.body1}
      </p>

      <blockquote
        data-reveal
        className="mt-8 mb-8 border-l-2 border-primary pl-6 italic text-muted-foreground"
        style={sStyle}
      >
        &ldquo;{SAMPLE.quote}&rdquo;
      </blockquote>

      <h2
        data-reveal
        className="scroll-m-20 border-b border-border pb-2 text-3xl font-semibold tracking-tight mt-10 mb-6 text-foreground"
        style={{ ...pStyle, fontSize: pControls.size * 0.75 }}
      >
        The Anatomy of Type
      </h2>

      <p data-reveal className="leading-7 [&:not(:first-child)]:mt-6 text-foreground" style={sStyle}>
        {SAMPLE.body2}
      </p>

      <h3
        data-reveal
        className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4 text-foreground"
        style={{ ...pStyle, fontSize: pControls.size * 0.6 }}
      >
        Principles of Pairing
      </h3>

      <ul data-reveal className="my-6 ml-6 list-disc [&>li]:mt-2 text-foreground" style={sStyle}>
        <li><strong>Contrast is key:</strong> Pair a serif with a sans-serif for distinct hierarchy.</li>
        <li><strong>Match x-heights:</strong> Fonts with similar lowercase heights often feel harmonious.</li>
        <li><strong>Avoid overwhelming similarity:</strong> If two fonts are too close, they clash rather than complement.</li>
      </ul>

      <p data-reveal className="leading-7 [&:not(:first-child)]:mt-6 text-foreground" style={sStyle}>
        {SAMPLE.body3} {SAMPLE.body4}
      </p>
    </div>
  );
}
