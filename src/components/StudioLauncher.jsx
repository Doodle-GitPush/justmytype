import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { STUDIO_ITEMS } from '../lib/studioCatalog';
import { prefersReducedMotion } from '@/lib/gsap';

const CYCLE_MS = 3200;

/**
 * The Studio pill beside the dock. It used to be a plain "Studio"
 * button over a popover list — easy to never press. Now it opens the
 * Studio home directly and says what's inside: a second line under
 * the name rolls through each mode's teaser ("Animate this pair",
 * "Make a poster"…), and the icon swaps to match.
 *
 * Fixed width, so the text box beside it never shifts as the teaser
 * changes length. Under reduced motion the line stays put on the first
 * teaser.
 */
export default function StudioLauncher({ onOpen }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || prefersReducedMotion()) return;
    const t = setInterval(() => setI((n) => (n + 1) % STUDIO_ITEMS.length), CYCLE_MS);
    return () => clearInterval(t);
  }, [paused]);

  const item = STUDIO_ITEMS[i];
  const Icon = item.icon;

  return (
    <button
      onClick={() => onOpen('create')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Open Glyph studio — create and play with this pair"
      /* Solid brand orange — the one filled pill in the dock, so the
         Studio reads as a destination rather than another control. */
      className="group pointer-events-auto shrink-0 flex items-center gap-2.5 h-[52px] pl-3 pr-4 sm:pr-5 sm:w-[184px] rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:bg-primary/95 hover:scale-[1.03] active:scale-95"
    >
      <span className="relative w-8 h-8 shrink-0 rounded-full bg-primary-foreground/20 flex items-center justify-center">
        <Icon key={item.id} size={15} className="motion-safe:animate-[jmt-roll-in_280ms_ease-out]" />
        {/* a small sparkle marking this as the "more" place */}
        <Sparkles size={10} className="absolute -top-0.5 -right-0.5 text-primary bg-primary-foreground rounded-full p-[1px]" />
      </span>
      <span className="hidden sm:flex flex-col items-start min-w-0 leading-tight">
        <span className="text-[13px] font-semibold">Glyph studio</span>
        <span
          key={item.id}
          className="text-[11px] text-primary-foreground/80 truncate max-w-[118px] motion-safe:animate-[jmt-roll-in_280ms_ease-out]"
        >
          {item.teaser}
        </span>
      </span>
    </button>
  );
}
