import { useEffect, useRef, useState } from 'react';
import { Heart, X, Check, Trash2, Sparkles } from 'lucide-react';
import { FONTS } from '../data/fonts';
import { loadFont } from '../lib/fontLoader';
import { stack } from '../lib/typeStyles';
import { generatePair, MOODS } from '../lib/pairing';
import { likePair, passPair, removeLiked, useLikedPairs, tasteProfile } from '../lib/likedPairs';
import { track } from '../lib/achievements';
import { gsap, prefersReducedMotion } from '@/lib/gsap';
import { StudioHeader, Segmented } from './studio/StudioUI';
import { cn } from '@/lib/utils';

const HEADLINES = [
  'The quiet art of letters',
  'Make it bold, make it last',
  'Notes from a small studio',
  'Every shape has a voice',
  'Late light over the harbour',
  'Designing for the long read',
  'Tiny details, big feelings',
];
const BODY =
  'Good typography is the invisible thread that holds a design together. It guides the eye, sets the mood, and lets the words do their work.';

const makeCard = (mood) => {
  const { heading, body, reason } = generatePair({ pool: FONTS, mood });
  loadFont(heading);
  loadFont(body);
  return {
    heading, body, reason,
    headline: HEADLINES[Math.floor(Math.random() * HEADLINES.length)],
    key: `${heading}|${body}|${Math.random()}`,
  };
};

function Card({ card, style, className, children, ref, ...props }) {
  const tags = card.reason.split(' · ');
  return (
    <div
      ref={ref}
      className={cn('absolute inset-0 rounded-[28px] border border-border bg-card shadow-xl p-6 sm:p-7 flex flex-col select-none touch-none overflow-hidden', className)}
      style={style}
      {...props}
    >
      {/* A big faint "Aa" in the heading face — texture, not content. */}
      <div aria-hidden="true" className="absolute -right-4 -bottom-10 text-[200px] leading-none text-foreground/[0.04] pointer-events-none" style={{ fontFamily: stack(card.heading), fontWeight: 700 }}>Aa</div>

      <div className="flex flex-wrap gap-1 relative">
        {tags.map((t) => (
          <span key={t} className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', t === 'hand-picked' ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300' : 'bg-muted text-muted-foreground')}>
            {t === 'hand-picked' ? '★ Hand-picked' : t}
          </span>
        ))}
      </div>

      <div className="mt-6 text-[38px] sm:text-[42px] leading-[1.02] text-foreground [text-wrap:balance] relative" style={{ fontFamily: stack(card.heading), fontWeight: 700 }}>
        {card.headline}
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground relative" style={{ fontFamily: stack(card.body) }}>{BODY}</p>

      <div className="mt-auto pt-4 border-t border-border grid grid-cols-2 gap-3 relative">
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Heading</div>
          <div className="text-[15px] text-foreground truncate" style={{ fontFamily: stack(card.heading), fontWeight: 700 }}>{card.heading}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Body</div>
          <div className="text-[15px] text-foreground truncate" style={{ fontFamily: stack(card.body) }}>{card.body}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * Type Match — swipe right on pairings you like, left on ones you don't.
 * Likes are saved (and can be sent straight to the editor); over time it
 * tells you what kind of pairings you keep falling for.
 */
export default function MatchGame({ onExit, onApply }) {
  const [mood, setMood] = useState('any');
  const [cards, setCards] = useState(() => [makeCard('any'), makeCard('any'), makeCard('any')]);
  const [showLiked, setShowLiked] = useState(false);
  const store = useLikedPairs();
  const profile = tasteProfile(store);

  const topRef = useRef(null);
  const likeRef = useRef(null);
  const nopeRef = useRef(null);
  const drag = useRef(null);
  const busy = useRef(false);

  const top = cards[0];

  // Liked pairs render in their own faces, so make sure those are loaded.
  useEffect(() => {
    if (!showLiked) return;
    store.liked.forEach((p) => { loadFont(p.heading); loadFont(p.body); });
  }, [showLiked, store.liked]);

  const decide = (liked) => {
    if (busy.current || !top) return;
    busy.current = true;
    if (liked) { likePair(top.heading, top.body); track('like'); } else passPair(top.heading, top.body);
    track('swipe', { fonts: [top.heading, top.body] });

    const finish = () => {
      busy.current = false;
      setCards(([, ...rest]) => [...rest, makeCard(mood)]);
    };
    if (prefersReducedMotion() || !topRef.current) return finish();
    gsap.to(topRef.current, {
      x: (liked ? 1 : -1) * window.innerWidth * 0.8,
      rotation: liked ? 24 : -24,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: finish,
    });
  };

  // New top card: reset whatever the last swipe left on the element.
  useEffect(() => {
    if (topRef.current) gsap.set(topRef.current, { x: 0, rotation: 0, opacity: 1 });
    [likeRef.current, nopeRef.current].forEach((el) => el && gsap.set(el, { opacity: 0 }));
  }, [top?.key]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') decide(true);
      if (e.key === 'ArrowLeft') decide(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const changeMood = (m) => {
    setMood(m);
    setCards([makeCard(m), makeCard(m), makeCard(m)]);
  };

  const onPointerDown = (e) => {
    if (busy.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, dx: 0 };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    d.dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    gsap.set(topRef.current, { x: d.dx, y: dy * 0.3, rotation: d.dx / 18 });
    gsap.set(likeRef.current, { opacity: Math.max(0, Math.min(1, d.dx / 120)) });
    gsap.set(nopeRef.current, { opacity: Math.max(0, Math.min(1, -d.dx / 120)) });
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (Math.abs(d.dx) > 110) decide(d.dx > 0);
    else {
      gsap.to(topRef.current, { x: 0, y: 0, rotation: 0, duration: 0.35, ease: 'back.out(1.6)' });
      gsap.to([likeRef.current, nopeRef.current], { opacity: 0, duration: 0.2 });
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-background text-foreground flex flex-col">
      <StudioHeader title="Type Match" subtitle={`${store.liked.length} liked`} onExit={onExit}>
        <button
          onClick={() => setShowLiked((v) => !v)}
          aria-pressed={showLiked}
          aria-label="Liked pairs"
          className={cn('h-10 px-4 rounded-full border text-[13px] font-semibold flex items-center gap-2', showLiked ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}
        >
          <Heart size={15} /> <span className="hidden sm:inline">Liked</span>
        </button>
      </StudioHeader>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-4 overflow-hidden">
          <div className="max-w-full overflow-x-auto scrollbar-hide">
            <Segmented fit className="w-max" value={mood} onChange={changeMood} options={MOODS} />
          </div>

          <div className="relative w-[360px] max-w-[88vw] h-[500px] max-h-[60vh]">
            {cards[2] && <Card key={cards[2].key} card={cards[2]} className="scale-[0.9] translate-y-6 opacity-50" />}
            {cards[1] && <Card key={cards[1].key} card={cards[1]} className="scale-[0.95] translate-y-3 opacity-80" />}
            {top && (
              <Card
                key={top.key}
                card={top}
                ref={topRef}
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <div ref={likeRef} className="absolute top-6 right-6 rotate-12 border-[3px] border-emerald-500 text-emerald-500 bg-card/80 rounded-xl px-3 py-1 text-[20px] font-black tracking-wider opacity-0">LIKE</div>
                <div ref={nopeRef} className="absolute top-6 left-6 -rotate-12 border-[3px] border-rose-500 text-rose-500 bg-card/80 rounded-xl px-3 py-1 text-[20px] font-black tracking-wider opacity-0">NOPE</div>
              </Card>
            )}
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <button onClick={() => decide(false)} aria-label="Nope" title="Nope (←)" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-card border border-border shadow-lg text-rose-500 flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
              <X size={26} strokeWidth={2.5} />
            </button>
            <button onClick={() => top && onApply(top.heading, top.body)} title="Open this pair in the editor" className="h-11 px-5 rounded-full bg-card border border-border shadow-sm text-[13px] font-semibold flex items-center gap-2 hover:bg-muted">
              <Check size={15} /> Use pair
            </button>
            <button onClick={() => decide(true)} aria-label="Like" title="Like (→)" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-card border border-border shadow-lg text-emerald-500 flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
              <Heart size={24} strokeWidth={2.5} />
            </button>
          </div>
          <p className="text-[12px] text-muted-foreground hidden sm:block">Drag the card, or use ← and →</p>
        </div>

        {showLiked && (
          <aside className="lg:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l border-border overflow-y-auto bg-background max-h-[45vh] lg:max-h-none">
            <div className="px-4 sm:px-5 py-4 flex items-center justify-between border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
              <span className="text-[13px] font-semibold">Liked pairs</span>
              <span className="text-[12px] text-muted-foreground tabular-nums">{store.liked.length}</span>
            </div>
            <div className="p-4 sm:p-5 flex flex-col gap-3">
              {profile && (
                <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-foreground p-4 text-[13px] leading-relaxed flex gap-2.5">
                  <Sparkles size={16} className="text-primary shrink-0 mt-0.5" /> <span>{profile}</span>
                </div>
              )}
              {!store.liked.length && (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-[13px] text-muted-foreground">
                  <Heart size={20} className="mx-auto mb-2 opacity-50" />
                  Pairs you like collect here.
                </div>
              )}
              {store.liked.map((p) => (
                <div key={`${p.heading}|${p.body}`} className="group rounded-2xl border border-border bg-card p-3 flex items-center gap-3 hover:border-foreground/20 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-[22px] shrink-0" style={{ fontFamily: stack(p.heading), fontWeight: 700 }}>Aa</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] leading-tight truncate" style={{ fontFamily: stack(p.heading), fontWeight: 700 }}>{p.heading}</div>
                    <div className="text-[12px] text-muted-foreground truncate" style={{ fontFamily: stack(p.body) }}>{p.body}</div>
                  </div>
                  <button onClick={() => onApply(p.heading, p.body)} className="text-[12px] font-semibold text-primary px-2.5 py-1.5 rounded-lg hover:bg-primary/10">Use</button>
                  <button onClick={() => removeLiked(p.heading, p.body)} aria-label="Remove" className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive opacity-60 group-hover:opacity-100"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
