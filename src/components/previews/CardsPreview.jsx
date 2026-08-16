import { useRef } from 'react';
import { gsap, useGSAP, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';
import { SAMPLE } from '../../data/content';

const GRADIENTS = [
  'bg-gradient-to-br from-blue-500 to-cyan-300',
  'bg-gradient-to-br from-pink-400 to-orange-300',
  'bg-gradient-to-br from-emerald-400 to-teal-300',
];

export default function CardsPreview({ pStyle, sStyle, pControls, revealKey }) {
  const scope = useRef(null);

  useGSAP(
    () => {
      const cards = gsap.utils.selector(scope)('[data-card]');
      if (!cards.length) return;

      if (prefersReducedMotion()) {
        gsap.set(cards, { opacity: 1, y: 0, rotateX: 0 });
        return;
      }

      gsap.from(cards, {
        opacity: 0,
        y: 40,
        rotateX: -12,
        transformOrigin: 'center top',
        duration: DUR.slow,
        ease: EASE.out,
        stagger: 0.1,
      });
    },
    { scope, dependencies: [revealKey], revertOnUpdate: true }
  );

  return (
    <div className="w-full flex-1 flex items-center justify-center lg:-mt-20">
      <div
        ref={scope}
        className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 max-w-[840px] mx-auto w-full px-4 lg:px-8 [perspective:1200px]"
      >
        {[1, 2, 3].map((num, i) => (
          <div
            key={num}
            data-card
            className="bg-card/50 rounded-xl border border-border overflow-hidden shadow-sm flex flex-col transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)]"
          >
            <div className={`h-[130px] w-full ${GRADIENTS[i]}`} />
            <div className="p-5 flex flex-col text-left">
              <div
                className="text-[11px] font-semibold uppercase text-primary mb-2"
                style={{ fontFamily: sStyle.fontFamily }}
              >
                Tip 0{num}
              </div>
              <h3
                className="text-foreground mb-2.5"
                style={{ ...pStyle, fontSize: pControls.size * 0.6 }}
              >
                {SAMPLE.cardTitles[i]}
              </h3>
              <p className="text-muted-foreground mb-3.5 line-clamp-3" style={sStyle}>
                {SAMPLE.cardBodies[i]}
              </p>
              <a
                href="#"
                className="text-[13px] font-medium text-primary no-underline mt-auto"
                style={{ fontFamily: sStyle.fontFamily }}
              >
                Read more →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
