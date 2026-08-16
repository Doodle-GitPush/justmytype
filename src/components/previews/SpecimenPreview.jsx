import { useRef } from 'react';
import { gsap, useGSAP, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';

const ROWS = [
  { key: 'Alphabet', content: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz', size: 'text-[clamp(18px,2.5vw,28px)]' },
  { key: 'Numerals', content: '0123456789', size: 'text-[clamp(16px,2vw,24px)]' },
  { key: 'Punctuation', content: '!@#$%^&*()_+\\~|{}[];:\'"/?<>', size: 'text-[clamp(14px,1.5vw,20px)]' },
];

function Panel({ label, badgeClass, style, family, side }) {
  return (
    <div
      data-panel
      className={`p-6 lg:w-1/2 bg-background relative overflow-hidden flex flex-col ${
        side === 'left' ? 'border-b lg:border-b-0 lg:border-r border-border' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-3">
        <div className="text-[14px] font-semibold text-foreground tracking-tight truncate pr-3">{family}</div>
        <div className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold border-transparent shrink-0 ${badgeClass}`}>
          {label}
        </div>
      </div>

      <div className="flex flex-col gap-6 relative z-10 flex-1 justify-start py-2" style={style}>
        {ROWS.map((row, i) => (
          <div key={row.key} className={i > 0 ? 'pt-4 border-t border-border/30' : undefined}>
            <div
              className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-3"
              style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
            >
              {row.key}
            </div>
            <div
              data-spec-row
              className={`${row.size} break-words leading-[1.3] text-foreground ${
                row.key === 'Alphabet' ? 'font-medium pr-2' : 'text-foreground/85 tracking-[0.08em]'
              }`}
            >
              {row.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SpecimenPreview({ pStyle, sStyle, primaryFont, secondaryFont, revealKey }) {
  const scope = useRef(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(scope);

      if (prefersReducedMotion()) {
        gsap.set([q('[data-panel]'), q('[data-spec-row]')], { opacity: 1, y: 0, xPercent: 0 });
        return;
      }

      gsap
        .timeline({ defaults: { ease: EASE.out } })
        .from(q('[data-panel]'), { opacity: 0, y: 26, duration: DUR.slow, stagger: 0.12 })
        .from(q('[data-spec-row]'), { opacity: 0, y: 14, duration: DUR.base, stagger: 0.05 }, 0.2);
    },
    { scope, dependencies: [revealKey], revertOnUpdate: true }
  );

  return (
    <div className="w-full h-full flex lg:items-center justify-center px-0 lg:px-8 overflow-y-visible lg:overflow-y-auto overflow-x-hidden scrollbar-hide">
      <div
        ref={scope}
        className="w-full max-w-[1200px] mx-auto bg-card border lg:border-border border-transparent lg:rounded-xl shadow-none lg:shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col lg:flex-row"
      >
        <Panel
          side="left"
          label="Primary"
          family={primaryFont}
          style={pStyle}
          badgeClass="bg-primary text-primary-foreground"
        />
        <Panel
          side="right"
          label="Secondary"
          family={secondaryFont}
          style={sStyle}
          badgeClass="bg-secondary text-secondary-foreground"
        />
      </div>
    </div>
  );
}
