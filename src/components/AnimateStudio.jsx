import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { gsap, useGSAP, SplitText, prefersReducedMotion } from '@/lib/gsap';
import { KINETIC_EFFECTS, KINETIC_EFFECT_ORDER } from '../lib/kineticEffects';
import { stack } from '../lib/typeStyles';

/**
 * A dedicated full-screen mode for watching the currently selected font
 * animate — kinetic-typography style (text spinning in a circle, flowing
 * along a path, rolling in a wave), continuously, rather than a one-shot
 * entrance effect. Read-only: there's no split-mid-edit hazard to guard
 * against here the way the earlier one-shot version had to, since the
 * text is never touched while an effect is live.
 */
export default function AnimateStudio({ primaryFont, pControls, text, onExit }) {
  const wordRef = useRef(null);
  const stageRef = useRef(null);
  const [styleKey, setStyleKey] = useState('circle');
  // Holds whatever the currently-live effect created — not state, since
  // nothing here should re-render off it, just be torn down by it.
  const activeRef = useRef({ tween: null, split: null });

  const teardown = () => {
    activeRef.current.tween?.kill();
    const word = wordRef.current;
    // Only the props Circle ever sets on the word element itself — NOT
    // 'all'. clearProps:'all' strips every inline style regardless of who
    // set it, including this element's own fontFamily/fontWeight/fontSize/
    // lineHeight from its style prop, and once gone React won't reapply
    // them (its virtual DOM didn't change, so it has no reason to re-diff
    // that attribute) — the headline silently fell back to the browser
    // default font and size the moment any effect first tore down.
    if (word) gsap.set(word, { clearProps: 'rotation,x,y,width,height,position,transformOrigin' });
    activeRef.current.split?.revert();
    activeRef.current = { tween: null, split: null };
  };

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(stageRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
  }, []);

  useGSAP(
    () => {
      // Defensive, not just for cleanliness: relying solely on useGSAP's
      // own dependency-change teardown left the previous effect's
      // continuous tween running forever underneath the new one — Circle's
      // rotation kept climbing across every later switch, compounding
      // with whatever ran next. Tearing down explicitly on every entry,
      // not just on exit, means there's never a moment where two effects'
      // tweens are both alive on the same element.
      teardown();

      const word = wordRef.current;
      if (!word || !word.textContent.trim() || prefersReducedMotion()) return;

      const effect = KINETIC_EFFECTS[styleKey] ?? KINETIC_EFFECTS.circle;
      // onSplit fires synchronously inside SplitText.create() itself — the
      // `split` variable it's assigned to hasn't finished initializing yet
      // at that point, so referencing it from inside this same callback
      // hits its temporal dead zone. Only touch activeRef in here; `split`
      // gets attached to it right after, once the assignment below exists.
      const split = SplitText.create(word, {
        type: 'chars',
        onSplit: (self) => {
          const tween = effect.build(self.chars, word);
          activeRef.current.tween = tween;
          return tween;
        },
      });
      activeRef.current.split = split;

      return teardown;
    },
    { dependencies: [styleKey, text, primaryFont, pControls.weight], revertOnUpdate: true }
  );

  // Safety net for unmount (e.g. Back to editor mid-animation) — harmless
  // if the effect above already tore everything down.
  useEffect(() => teardown, []);

  return (
    <div className="fixed inset-0 z-[90] bg-background text-foreground flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-border shrink-0">
        <button
          onClick={onExit}
          className="flex items-center gap-2 bg-background/80 backdrop-blur border border-border px-4 py-2.5 rounded-full text-[13px] font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 hover:bg-card text-foreground"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back to editor</span>
        </button>

        <div className="flex items-center gap-2 text-[13px] text-muted-foreground truncate">
          <span className="hidden sm:inline">Animating</span>
          <span className="text-foreground font-medium truncate max-w-[40vw]" style={{ fontFamily: stack(primaryFont) }}>
            {primaryFont}
          </span>
        </div>

        {/* Balances the Back button so the font name above stays centered. */}
        <div className="w-[88px] sm:w-[148px]" aria-hidden="true" />
      </div>

      <div ref={stageRef} className="flex-1 flex items-center justify-center px-6 sm:px-10 overflow-hidden min-h-0">
        <div
          ref={wordRef}
          className="max-w-[92vw] text-center tracking-tight [text-wrap:balance]"
          style={{
            fontFamily: stack(primaryFont),
            fontWeight: pControls.weight,
            fontSize: 'clamp(40px, 9vw, 130px)',
            lineHeight: 1.15,
          }}
        >
          {text}
        </div>
      </div>

      <div className="border-t border-border px-4 sm:px-6 py-4 shrink-0 flex items-center justify-center gap-2">
        {KINETIC_EFFECT_ORDER.map((key) => {
          const active = styleKey === key;
          return (
            <button
              key={key}
              onClick={() => setStyleKey(key)}
              className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background/80 backdrop-blur text-foreground border-border hover:bg-card'
              }`}
            >
              {KINETIC_EFFECTS[key].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
