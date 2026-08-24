import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCw } from 'lucide-react';
import { gsap, useGSAP, SplitText, prefersReducedMotion } from '@/lib/gsap';
import { TEXT_ANIMATIONS, TEXT_ANIMATION_ORDER, bevelTextShadow } from '../lib/textAnimations';
import { stack } from '../lib/typeStyles';
import ScrubField from './ScrubField';

/**
 * A dedicated full-screen mode for animating the currently selected
 * headline font, rather than one fixed effect bolted onto the Focus tab.
 * Owns its own text-mid-split lock/revert (typing into a still-splitting
 * contentEditable field lands characters in the wrong place — see the
 * comment on `playAnim` below) and its own play trigger (`playToken`)
 * rather than reusing FocusPreview's — the two no longer share any
 * animation logic.
 */
export default function AnimateStudio({ primaryFont, pControls, text, onTextChange, isDark, onExit }) {
  const wordRef = useRef(null);
  const stageRef = useRef(null);
  // The still-split SplitText instance from the animation that just
  // finished, if any — see the comment above `revertActiveSplit` for why
  // this isn't reverted immediately on completion.
  const activeSplitRef = useRef(null);

  const [styleKey, setStyleKey] = useState('swirl');
  const [speed, setSpeed] = useState(1);
  const [size, setSize] = useState(() => Math.min(200, Math.max(72, pControls.size * 3)));
  const [bevel, setBevel] = useState(0.3);
  const [intensity, setIntensity] = useState(1);
  const [playToken, setPlayToken] = useState(0);
  const replay = () => setPlayToken((t) => t + 1);

  // This view owns the headline's text after mount — TypeDock isn't
  // mounted while the studio is up, so there's no concurrent external
  // writer to stay in sync with the way FocusPreview has to. Must be a
  // layout effect, not a plain effect: useGSAP's own effect (which reads
  // this text to decide whether to play) uses useLayoutEffect internally,
  // which fires before any plain useEffect in the same commit — with a
  // plain effect here, the very first auto-play ran while the headline
  // was still empty, saw nothing to animate, and silently no-opped.
  useLayoutEffect(() => {
    if (wordRef.current) wordRef.current.textContent = text;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onExit]);

  // Mount fade — this whole mode replaces the normal shell, so it gets one
  // beat of its own rather than just popping in.
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(stageRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
  }, []);

  // Splitting into individual characters breaks the natural kerning
  // between letter pairs (each character becomes its own isolated inline
  // box), so the split state and the plain-text state don't measure
  // pixel-identical even once every char is back at opacity 1 / scale 1 /
  // x,y 0 — reverting from one to the other always causes a tiny
  // horizontal reflow. Reverting the instant the tween completed put that
  // reflow exactly at the moment someone was watching the result settle,
  // which read as the text randomly shifting. Deferred here to whichever
  // happens first: the next play (revert happens right as a new animation
  // starts, so the reflow is masked by something already moving) or the
  // next time the field is focused to edit it (a moment already
  // accompanied by a cursor appearing, so a pixel of drift isn't the only
  // thing changing).
  const revertActiveSplit = () => {
    if (!activeSplitRef.current) return;
    activeSplitRef.current.revert();
    activeSplitRef.current = null;
  };

  useGSAP(
    () => {
      const word = wordRef.current;
      if (!word || !word.textContent.trim()) return;
      revertActiveSplit();
      if (prefersReducedMotion()) { gsap.set(word, { opacity: 1 }); return; }

      const preset = TEXT_ANIMATIONS[styleKey] ?? TEXT_ANIMATIONS.swirl;
      // Typing into the field while it's mid-split (spans instead of plain
      // text) lands characters in the wrong place entirely — browsers
      // don't resolve cursor position through many inline spans the way
      // they do through one text node. Locking editing while it plays
      // avoids that rather than trying to make split text reliably
      // editable.
      word.contentEditable = 'false';
      SplitText.create(word, {
        type: 'chars',
        autoSplit: true,
        onSplit: (self) => {
          const tween = preset.build(self.chars, { speed, intensity });
          tween.eventCallback('onComplete', () => {
            word.contentEditable = 'true';
            activeSplitRef.current = self;
          });
          return tween;
        },
      });
    },
    // Only playToken drives a replay — Speed/Size/Bevel/Intensity update
    // live state that the *next* play reads, but dragging a slider must
    // not itself restart the animation or every pixel of travel would
    // re-split and re-fire it.
    { dependencies: [playToken] }
  );

  // Cleanup on unmount (e.g. Back to editor while still split).
  useEffect(() => () => revertActiveSplit(), []);

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

        <button
          onClick={replay}
          aria-label="Replay animation"
          title="Replay"
          className="flex items-center justify-center w-10 h-10 bg-background/80 backdrop-blur border border-border rounded-full text-foreground shadow-sm transition-all hover:bg-card hover:scale-105 active:scale-95"
        >
          <RotateCw size={16} />
        </button>
      </div>

      <div ref={stageRef} className="flex-1 flex items-center justify-center px-6 sm:px-10 overflow-hidden min-h-0">
        <div
          ref={wordRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          role="textbox"
          aria-label="Text to animate"
          title="Click to edit"
          onFocus={revertActiveSplit}
          onInput={(e) => onTextChange?.(e.currentTarget.textContent)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); document.execCommand('insertLineBreak'); }
          }}
          className="max-w-[92vw] text-center tracking-tight outline-none cursor-text [text-wrap:balance]"
          style={{
            fontFamily: stack(primaryFont),
            fontWeight: pControls.weight,
            fontSize: `${size}px`,
            lineHeight: 1.15,
            textShadow: bevelTextShadow(bevel, isDark),
          }}
        />
      </div>

      <div className="border-t border-border px-4 sm:px-6 py-4 shrink-0 flex flex-col gap-3 max-w-[860px] w-full mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {TEXT_ANIMATION_ORDER.map((key) => {
            const active = styleKey === key;
            return (
              <button
                key={key}
                onClick={() => { setStyleKey(key); replay(); }}
                className={`shrink-0 px-3.5 py-2 rounded-full text-[13px] font-medium border transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background/80 backdrop-blur text-foreground border-border hover:bg-card'
                }`}
              >
                {TEXT_ANIMATIONS[key].label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <ScrubField label="Speed" value={speed} min={0.4} max={2.5} step={0.05} precision={2} suffix="×" sensitivity={4} onChange={setSpeed} />
          <ScrubField label="Size" value={size} min={32} max={260} step={2} suffix="px" sensitivity={3} onChange={setSize} />
          <ScrubField label="Bevel" value={bevel} min={0} max={1} step={0.05} precision={2} sensitivity={6} onChange={setBevel} />
          <ScrubField label="Intensity" value={intensity} min={0.3} max={2.5} step={0.05} precision={2} sensitivity={4} onChange={setIntensity} />
        </div>
      </div>
    </div>
  );
}
