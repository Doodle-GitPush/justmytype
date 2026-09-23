import { useEffect, useRef, useState } from 'react';
import { Heart, X, Check, Trash2, Sparkles } from 'lucide-react';
import { FONTS } from '../data/fonts';
import { loadFont } from '../lib/fontLoader';
import { stack } from '../lib/typeStyles';
import { generatePair, MOODS } from '../lib/pairing';
import { likePair, passPair, removeLiked, useLikedPairs, tasteProfile } from '../lib/likedPairs';
import { track } from '../lib/achievements';
import { gsap, prefersReducedMotion } from '@/lib/gsap';
import { StudioHeader, Chip } from './studio/StudioUI';
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
  return (
    <div
      ref={ref}
      className={cn('absolute inset-0 rounded-[28px] border border-border bg-card shadow-xl p-7 flex flex-col select-none touch-none', className)}
      style={style}
      {...props}
    >
      <div className="text-[96px] leading-none text-foreground" style={{ fontFamily: stack(card.heading), fontWeight: 700 }}>Aa</div>
      <div className="mt-5 text-[34px] leading-[1.05] text-foreground [text-wrap:balance]" style={{ fontFamily: stack(card.heading), fontWeight: 700 }}>
        {card.headline}
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground" style={{ fontFamily: stack(card.body) }}>{BODY}</p>
      <div className="mt-auto pt-4 border-t border-border flex flex-col gap-1">
        <div className="text-[13px] text-foreground font-medium truncate">{card.heading} <span className="text-muted-foreground">+</span> {card.body}</div>
        <div className="text-[11px] text-muted-foreground">{card.reason}</div>
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
  const [cards, setCards] = useState(() => [makeCard('any'), makeCard('any')]);
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
      setCards(([, second]) => [second, makeCard(mood)]);
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
    setCards([makeCard(m), makeCard(m)]);
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
          className={cn('h-10 px-4 rounded-full border text-[13px] font-semibold flex items-center gap-2', showLiked ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}
        >
          <Heart size={15} /> <span className="hidden sm:inline">Liked</span>
        </button>
      </StudioHeader>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-4 overflow-hidden">
          <div className="flex flex-wrap justify-center gap-1.5">
            {MOODS.map((m) => <Chip key={m.id} active={mood === m.id} onClick={() => changeMood(m.id)}>{m.label}</Chip>)}
          </div>

          <div className="relative w-[360px] max-w-[88vw] h-[480px] max-h-[62vh]">
            {cards[1] && <Card key={cards[1].key} card={cards[1]} className="scale-[0.95] translate-y-3 opacity-80" />}
            {top && (
              <Card
                key={top.key}
                card={top}
                ref={topRef}
                style={{ cursor: 'grab' }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <div ref={likeRef} className="absolute top-6 left-6 -rotate-12 border-4 border-emerald-500 text-emerald-500 rounded-xl px-3 py-1 text-[22px] font-black opacity-0">LIKE</div>
                <div ref={nopeRef} className="absolute top-6 right-6 rotate-12 border-4 border-rose-500 text-rose-500 rounded-xl px-3 py-1 text-[22px] font-black opacity-0">NOPE</div>
              </Card>
            )}
          </div>

          <div className="flex items-center gap-5">
            <button onClick={() => decide(false)} aria-label="Nope" className="w-16 h-16 rounded-full border-2 border-rose-500/40 text-rose-500 flex items-center justify-center hover:bg-rose-500/10 transition-colors">
              <X size={28} />
            </button>
            <button onClick={() => top && onApply(top.heading, top.body)} className="h-11 px-5 rounded-full border border-border text-[13px] font-semibold flex items-center gap-2 hover:bg-muted">
              <Check size={15} /> Use pair
            </button>
            <button onClick={() => decide(true)} aria-label="Like" className="w-16 h-16 rounded-full border-2 border-emerald-500/40 text-emerald-500 flex items-center justify-center hover:bg-emerald-500/10 transition-colors">
              <Heart size={26} />
            </button>
          </div>
          <p className="text-[12px] text-muted-foreground hidden sm:block">Swipe, or use ← and →</p>
        </div>

        {showLiked && (
          <aside className="lg:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l border-border overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 bg-background max-h-[45vh] lg:max-h-none">
            {profile && (
              <div className="rounded-2xl bg-primary/10 text-foreground p-4 text-[13px] leading-relaxed flex gap-2">
                <Sparkles size={16} className="text-primary shrink-0 mt-0.5" /> {profile}
              </div>
            )}
            {!store.liked.length && <p className="text-[13px] text-muted-foreground">Pairs you like will collect here.</p>}
            {store.liked.map((p) => (
              <div key={`${p.heading}|${p.body}`} className="rounded-xl border border-border p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[18px] leading-tight truncate" style={{ fontFamily: stack(p.heading), fontWeight: 700 }}>{p.heading}</div>
                  <div className="text-[13px] text-muted-foreground truncate" style={{ fontFamily: stack(p.body) }}>{p.body}</div>
                </div>
                <button onClick={() => onApply(p.heading, p.body)} className="text-[12px] font-semibold text-primary px-2 py-1 rounded-lg hover:bg-primary/10">Use</button>
                <button onClick={() => removeLiked(p.heading, p.body)} aria-label="Remove" className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><Trash2 size={13} /></button>
              </div>
            ))}
          </aside>
        )}
      </div>
    </div>
  );
}
