import { useEffect, useRef, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { stack } from '../../lib/typeStyles';
import { cn } from '@/lib/utils';

const EVERY = 4;          // every fourth generated pair…
const FIRST = 3;          // …starting with the third
const SHOW_MS = 7000;
const OFF_KEY = 'jmt:teaser-off';

const dismissed = () => {
  try { return sessionStorage.getItem(OFF_KEY) === '1'; } catch { return false; }
};

/**
 * "Like this pair?" — a small card that turns up now and then after
 * Generate, offering to take the pair somewhere: animate it, or put it
 * on a poster. It's the moment someone has just found a pair they
 * might like, which is exactly when the Studio is worth mentioning.
 *
 * Deliberately rare and easy to dismiss: the third pair, then every
 * fourth, gone by itself after seven seconds (paused while hovered),
 * and closing it silences it for the rest of the session.
 */
export default function StudioTeaser({ trigger, primaryFont, weight, onOpen, blocked }) {
  const [shown, setShown] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hideTimer = useRef(0);

  useEffect(() => {
    if (!trigger || blocked || dismissed()) return;
    if (trigger < FIRST || (trigger - FIRST) % EVERY !== 0) return;
    // After the new pair's own reveal has had a moment.
    const t = setTimeout(() => setShown(true), 900);
    return () => clearTimeout(t);
  }, [trigger, blocked]);

  useEffect(() => {
    clearTimeout(hideTimer.current);
    if (!shown || hovered) return;
    hideTimer.current = setTimeout(() => setShown(false), SHOW_MS);
    return () => clearTimeout(hideTimer.current);
  }, [shown, hovered, trigger]);

  const close = () => {
    setShown(false);
    try { sessionStorage.setItem(OFF_KEY, '1'); } catch { /* storage unavailable */ }
  };

  const go = (id) => { setShown(false); onOpen(id); };

  const face = { fontFamily: stack(primaryFont), fontWeight: weight };

  return (
    <div
      role="dialog"
      aria-label="Studio suggestion"
      aria-hidden={!shown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        // Out of the dock's way: bottom-right corner on desktop (clear of
        // the centred font pills), just under the header on phones where
        // the bottom of the screen is all dock.
        'fixed z-40 top-[72px] inset-x-3 lg:inset-x-auto lg:top-auto lg:right-6 lg:bottom-14 lg:w-[260px]',
        'rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl p-3',
        'transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.3,1.2,0.4,1)]',
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      )}
    >
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="text-[12px] font-semibold text-foreground">Like this pair?</span>
        <button onClick={close} aria-label="Don't suggest this again" tabIndex={shown ? 0 : -1} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
          <X size={13} />
        </button>
      </div>

      <button
        onClick={() => go('animate')}
        tabIndex={shown ? 0 : -1}
        className="group w-full flex items-center gap-3 p-1.5 rounded-xl hover:bg-muted text-left"
      >
        <span className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center overflow-hidden text-[18px] text-foreground" style={face} aria-hidden="true">
          {['A', 'a'].map((ch, i) => (
            <span key={i} className="inline-block motion-safe:animate-[jmt-wave_1.4s_ease-in-out_infinite]" style={{ animationDelay: `${i * 120}ms` }}>{ch}</span>
          ))}
        </span>
        <span className="flex-1 text-[13px] font-medium text-foreground">Animate it</span>
        <ArrowRight size={14} className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </button>

      <button
        onClick={() => go('poster')}
        tabIndex={shown ? 0 : -1}
        className="group w-full flex items-center gap-3 p-1.5 rounded-xl hover:bg-muted text-left"
      >
        <span className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center" aria-hidden="true">
          <span className="w-[26px] h-[34px] rounded-[2px] bg-[#1b1a17] text-[#f4efe6] flex items-end p-[3px] text-[11px] leading-none" style={face}>Aa</span>
        </span>
        <span className="flex-1 text-[13px] font-medium text-foreground">Put it on a poster</span>
        <ArrowRight size={14} className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </button>

      <button
        onClick={() => go('create')}
        tabIndex={shown ? 0 : -1}
        className="w-full mt-1 pt-2 border-t border-border text-[11.5px] text-muted-foreground hover:text-foreground text-center"
      >
        See everything in the Studio
      </button>
    </div>
  );
}
