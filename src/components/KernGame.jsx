import { useEffect, useMemo, useRef, useState } from 'react';
import { Trophy, ArrowRight, RotateCcw, Eye } from 'lucide-react';
import { FONT_METADATA } from '../data/fonts';
import { whenFontReady } from '../lib/fontLoader';
import { stack } from '../lib/typeStyles';
import { track } from '../lib/achievements';
import { gsap, prefersReducedMotion } from '@/lib/gsap';
import { StudioHeader } from './studio/StudioUI';
import useElementSize from '../hooks/useElementSize';
import { cn } from '@/lib/utils';

/**
 * Kern Type–style game. A word is shown with its inner letters knocked
 * out of place; drag them (or nudge with the arrow keys) until the
 * spacing looks even, then compare against the font's own spacing — its
 * designer's metrics and kerning — and get a score.
 */

const WORDS = [
  'KERNING', 'AVOW', 'WAVY', 'LOVELY', 'TYPOGRAPHY', 'Waltz', 'Yacht', 'VOYAGE', 'FLAVOR', 'ATLAS',
  'Tokyo', 'Minimum', 'HAMBURG', 'Jolly', 'Quartz', 'WATERY', 'Rhythm', 'LYRIC', 'Fjord', 'AWAY',
];
const ROUNDS = 6;

const pickFonts = () => {
  const pool = FONT_METADATA.filter((m) =>
    (m.pop ?? 9999) < 400 && !m.script && m.subsets?.includes('latin') &&
    (m.category === 'Serif' || m.category === 'Sans Serif' || m.category === 'Display')
  );
  return pool.sort(() => Math.random() - 0.5).slice(0, ROUNDS).map((m) => m.family);
};

const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

/** Kerned x-position and width of every character in a laid-out text node. */
const measureLetters = (el) => {
  const node = el.firstChild;
  if (!node) return [];
  const base = el.getBoundingClientRect().left;
  const range = document.createRange();
  return Array.from(node.textContent).map((_, i) => {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const r = range.getBoundingClientRect();
    return { x: r.left - base, w: r.width };
  });
};

// How a score reads, and the colour it wears.
const verdict = (score) =>
  score >= 97 ? { label: 'Perfect', tone: 'text-emerald-600', bar: 'bg-emerald-500' }
    : score >= 88 ? { label: 'Great eye', tone: 'text-emerald-600', bar: 'bg-emerald-500' }
    : score >= 70 ? { label: 'Good', tone: 'text-amber-600', bar: 'bg-amber-500' }
    : { label: 'Keep practising', tone: 'text-rose-600', bar: 'bg-rose-500' };

// Per-letter error colour after the reveal (error in em).
const errorTone = (em) => (em < 0.012 ? 'text-emerald-600' : em < 0.035 ? 'text-amber-600' : 'text-rose-600');

function Kbd({ children }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 rounded-md border border-border bg-card text-[11px] font-mono text-foreground">{children}</kbd>
  );
}

const scoreFor = (offsets, size) => {
  const inner = offsets.slice(1, -1);
  if (!inner.length) return 100;
  const mean = inner.reduce((s, o) => s + Math.abs(o), 0) / inner.length;
  // ~0.005em average error ≈ 97, ~0.02em ≈ 88; leaving the scrambled
  // letters untouched lands around 15.
  return Math.max(0, Math.round(100 - (mean / size) * 600));
};

export default function KernGame({ onExit }) {
  const [game, setGame] = useState(() => ({
    words: shuffle(WORDS).slice(0, ROUNDS),
    fonts: pickFonts(),
    round: 0,
    scores: [],
  }));
  const word = game.words[game.round];
  const font = game.fonts[game.round % game.fonts.length] ?? 'Inter';

  const [ready, setReady] = useState(false);
  const [layout, setLayout] = useState([]); // correct { x, w } per letter
  const [offsets, setOffsets] = useState([]);
  const [active, setActive] = useState(1);
  const [revealed, setRevealed] = useState(null); // score once submitted

  const refEl = useRef(null);
  const stageRef = useRef(null);
  const letterEls = useRef([]);
  const drag = useRef(null);

  // The word is sized to the card it sits on, so long words fit on a phone.
  const cardRef = useRef(null);
  const card = useElementSize(cardRef);
  const cardW = Math.round(card.w / 20) * 20;
  const size = useMemo(
    () => Math.min(170, Math.max(34, ((cardW || 900) * 0.84) / (Math.max(4, word.length) * 0.64))),
    [word, cardW]
  );
  const letters = useMemo(() => Array.from(word), [word]);
  const done = game.round >= game.words.length;

  // Load the font, then measure the real kerned layout from a single text node.
  useEffect(() => {
    if (done || !cardW) return;
    let cancelled = false;
    whenFontReady(font, 4000).then(() => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        const measured = measureLetters(refEl.current);
        setLayout(measured);
        setOffsets(measured.map((_, i) => {
          if (i === 0 || i === measured.length - 1) return 0;
          const mag = size * (0.06 + Math.random() * 0.16);
          return Math.random() < 0.5 ? -mag : mag;
        }));
        setActive(1);
        setReady(true);
      });
    });
    return () => { cancelled = true; };
  }, [font, word, size, done, cardW]);

  const nudge = (i, dx) => {
    if (revealed !== null || i <= 0 || i >= letters.length - 1) return;
    setOffsets((o) => o.map((v, j) => (j === i ? v + dx : v)));
  };

  const submit = () => {
    if (!ready || revealed !== null) return;
    const score = scoreFor(offsets, size);
    setRevealed(score);
    track('kern', { score });
    // Slide the letters home so the difference is visible, not just scored.
    if (!prefersReducedMotion()) {
      letterEls.current.forEach((el, i) => {
        if (el) gsap.fromTo(el, { x: offsets[i] }, { x: 0, duration: 0.9, delay: 0.9, ease: 'power3.inOut' });
      });
    }
  };

  const next = () => {
    const scores = [...game.scores, revealed ?? 0];
    const round = game.round + 1;
    setReady(false);
    setRevealed(null);
    setGame((g) => ({ ...g, scores, round }));
    if (round >= game.words.length) track('kern-game');
  };

  const restart = () => {
    setReady(false);
    setRevealed(null);
    startGame();
  };
  const startGame = () => setGame({ words: shuffle(WORDS).slice(0, ROUNDS), fonts: pickFonts(), round: 0, scores: [] });

  useEffect(() => {
    const onKey = (e) => {
      if (revealed !== null) {
        if (e.key === 'Enter') next();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        nudge(active, (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 10 : 1));
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const n = letters.length - 2;
        if (n > 0) setActive((a) => ((a - 1 + (e.shiftKey ? n - 1 : 1)) % n) + 1);
      } else if (e.key === 'Enter') {
        submit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });


  const onPointerDown = (e, i) => {
    if (revealed !== null || i === 0 || i === letters.length - 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(i);
    drag.current = { i, sx: e.clientX, start: offsets[i] };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const v = d.start + (e.clientX - d.sx);
    setOffsets((o) => o.map((x, j) => (j === d.i ? v : x)));
  };
  const onPointerUp = () => { drag.current = null; };

  const avg = game.scores.length ? Math.round(game.scores.reduce((a, b) => a + b, 0) / game.scores.length) : 0;
  const totalW = layout.length ? layout[layout.length - 1].x + layout[layout.length - 1].w : 0;

  return (
    <div className="fixed inset-0 z-[90] bg-background text-foreground flex flex-col">
      <StudioHeader title="Kern Game" subtitle={done ? 'Results' : `Word ${game.round + 1} of ${game.words.length}`} onExit={onExit}>
        {game.scores.length > 0 && <span className="text-[12px] tabular-nums text-muted-foreground px-2">Avg <b className="text-foreground">{avg}</b></span>}
      </StudioHeader>

      {/* Progress — one segment per word, tinted by how it went. */}
      <div className="flex gap-1.5 px-4 sm:px-6 pt-4 max-w-[720px] w-full mx-auto">
        {game.words.map((w, i) => (
          <div key={w} className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', i < game.scores.length ? verdict(game.scores[i]).bar : i === game.round ? 'bg-primary/50' : '')}
              style={{ width: i <= game.scores.length || i === game.round ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      {done ? (
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col items-center justify-center gap-6 p-6 text-center max-w-[640px] mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/15 text-amber-500 flex items-center justify-center"><Trophy size={30} /></div>
            <div>
              <div className="text-[72px] font-bold leading-none tabular-nums">{avg}</div>
              <div className={cn('mt-2 text-[15px] font-semibold', verdict(avg).tone)}>{verdict(avg).label}</div>
              <div className="text-muted-foreground text-[13px] mt-1">average across {game.scores.length} words</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
              {game.words.map((w, i) => (
                <div key={w} className="rounded-2xl border border-border bg-card p-3 flex flex-col items-center gap-1">
                  <span className="text-[20px] leading-tight truncate max-w-full" style={{ fontFamily: stack(game.fonts[i % game.fonts.length]) }}>{w}</span>
                  <span className={cn('text-[13px] font-semibold tabular-nums', verdict(game.scores[i]).tone)}>{game.scores[i]}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-full">{game.fonts[i % game.fonts.length]}</span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-[14px] max-w-[420px] leading-relaxed">
              {avg >= 95 ? 'Optical genius — type designers would hire you.' : avg >= 85 ? 'A keen eye. Your spacing is nearly invisible.' : avg >= 70 ? 'Solid. Watch the round letters — they need to sit closer than the straight ones.' : 'Try squinting: judge the space between letters as areas, not distances.'}
            </p>
            <button onClick={restart} className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2">
              <RotateCcw size={16} /> Play again
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4 sm:p-6 select-none overflow-hidden">
          <div ref={cardRef} className="w-full max-w-[1000px] rounded-3xl border border-border bg-card shadow-sm px-4 py-10 sm:py-14 flex flex-col items-center gap-6 relative overflow-hidden">
            <div className="absolute top-4 left-5 text-[12px] text-muted-foreground" style={{ fontFamily: stack(font) }}>{font}</div>
            {revealed !== null && (
              <div className={cn('absolute top-4 right-5 text-[12px] font-semibold', verdict(revealed).tone)}>{verdict(revealed).label}</div>
            )}

            <div ref={stageRef} className="relative mt-4" style={{ width: totalW || undefined, height: size * 1.3 }}>
              {/* The reference: one untouched text node, measured for the real kerned positions. */}
              <div ref={refEl} aria-hidden="true" className="absolute left-0 top-0 whitespace-pre invisible" style={{ fontFamily: stack(font), fontSize: size, lineHeight: 1.3, fontKerning: 'normal' }}>
                {word}
              </div>

              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-48 rounded-xl bg-muted animate-pulse" />
                </div>
              )}

              {ready && revealed !== null && layout.map((l, i) => (
                <span
                  key={`ghost-${i}`}
                  aria-hidden="true"
                  className="absolute top-0 text-primary/30"
                  style={{ left: l.x, fontFamily: stack(font), fontSize: size, lineHeight: 1.3 }}
                >
                  {letters[i]}
                </span>
              ))}

              {ready && layout.map((l, i) => {
                const fixed = i === 0 || i === letters.length - 1;
                const isActive = !fixed && active === i && revealed === null;
                return (
                  <span
                    key={`${word}-${i}`}
                    ref={(el) => { letterEls.current[i] = el; }}
                    onPointerDown={(e) => onPointerDown(e, i)}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    className={cn(
                      'absolute top-0 touch-none transition-colors',
                      revealed !== null
                        ? (fixed ? 'text-foreground/40' : errorTone(Math.abs(offsets[i] ?? 0) / size))
                        : fixed ? 'text-foreground/40' : 'cursor-ew-resize text-foreground hover:text-primary',
                      isActive && 'text-primary'
                    )}
                    style={{ left: l.x, transform: `translateX(${offsets[i] ?? 0}px)`, fontFamily: stack(font), fontSize: size, lineHeight: 1.3 }}
                  >
                    {letters[i]}
                    {/* A grab handle under each movable letter; the active one is filled. */}
                    {!fixed && revealed === null && (
                      <span className={cn('absolute left-1/2 -translate-x-1/2 -bottom-3 w-2 h-2 rounded-full transition-colors', isActive ? 'bg-primary' : 'bg-border')} />
                    )}
                  </span>
                );
              })}
            </div>

            {revealed !== null && (
              <div className="flex items-baseline gap-2">
                <span className="text-[48px] font-bold tabular-nums leading-none">{revealed}</span>
                <span className="text-[13px] text-muted-foreground">/ 100</span>
              </div>
            )}
          </div>

          {revealed === null ? (
            <>
              <button onClick={submit} disabled={!ready} className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2 disabled:opacity-50">
                <Eye size={16} /> Check spacing
              </button>
              <p className="text-[13px] text-muted-foreground text-center max-w-[560px] leading-relaxed">
                Drag the letters until the gaps look even — the first and last stay put.
                <span className="hidden sm:inline"> <Kbd>Tab</Kbd> picks a letter, <Kbd>←</Kbd><Kbd>→</Kbd> nudge (<Kbd>Shift</Kbd> for 10px), <Kbd>Enter</Kbd> checks.</span>
              </p>
            </>
          ) : (
            <>
              <button onClick={next} className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2">
                {game.round + 1 < game.words.length ? 'Next word' : 'See results'} <ArrowRight size={16} />
              </button>
              <p className="text-[13px] text-muted-foreground text-center">
                Faint letters are the font’s own spacing. <span className="text-emerald-600">Green</span> letters were close, <span className="text-rose-600">red</span> ones were off.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
