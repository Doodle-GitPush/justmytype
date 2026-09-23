import { useEffect, useMemo, useRef, useState } from 'react';
import { Trophy, ArrowRight, RotateCcw, Eye } from 'lucide-react';
import { FONT_METADATA } from '../data/fonts';
import { whenFontReady } from '../lib/fontLoader';
import { stack } from '../lib/typeStyles';
import { track } from '../lib/achievements';
import { gsap, prefersReducedMotion } from '@/lib/gsap';
import { StudioHeader } from './studio/StudioUI';
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

  const size = useMemo(() => Math.min(180, Math.max(64, 900 / Math.max(4, word.length))), [word]);
  const letters = useMemo(() => Array.from(word), [word]);
  const done = game.round >= game.words.length;

  // Load the font, then measure the real kerned layout from a single text node.
  useEffect(() => {
    if (done) return;
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
  }, [font, word, size, done]);

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
        <span className="text-[13px] tabular-nums text-muted-foreground hidden sm:inline">Avg {avg}</span>
      </StudioHeader>

      {done ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center">
          <Trophy size={40} className="text-primary" />
          <div>
            <div className="text-[64px] font-bold leading-none tabular-nums">{avg}</div>
            <div className="text-muted-foreground mt-2">average score across {game.scores.length} words</div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-[520px]">
            {game.words.map((w, i) => (
              <span key={w} className="text-[13px] px-3 py-1.5 rounded-full border border-border" style={{ fontFamily: stack(game.fonts[i % game.fonts.length]) }}>
                {w} · <b className="tabular-nums">{game.scores[i]}</b>
              </span>
            ))}
          </div>
          <p className="text-muted-foreground text-[14px] max-w-[420px]">
            {avg >= 95 ? 'Optical genius — type designers would hire you.' : avg >= 85 ? 'A keen eye. Your spacing is nearly invisible.' : avg >= 70 ? 'Solid. Watch the round letters — they need to sit closer.' : 'Keep going — try squinting to judge the space between letters as areas, not distances.'}
          </p>
          <button onClick={restart} className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2">
            <RotateCcw size={16} /> Play again
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-4 select-none overflow-hidden">
          <p className="text-[14px] text-muted-foreground text-center max-w-[520px]">
            Drag the letters until the spacing looks even. The first and last letters are fixed.
            <span className="hidden sm:inline"> Tab picks a letter, ←/→ nudge (Shift for 10px), Enter to check.</span>
          </p>

          <div ref={stageRef} className="relative" style={{ width: totalW || undefined, height: size * 1.3 }}>
            {/* The reference: one untouched text node, measured for the real kerned positions. */}
            <div ref={refEl} aria-hidden="true" className="absolute left-0 top-0 whitespace-pre invisible" style={{ fontFamily: stack(font), fontSize: size, lineHeight: 1.3, fontKerning: 'normal' }}>
              {word}
            </div>

            {ready && revealed !== null && layout.map((l, i) => (
              <span
                key={`ghost-${i}`}
                aria-hidden="true"
                className="absolute top-0 text-primary/35"
                style={{ left: l.x, fontFamily: stack(font), fontSize: size, lineHeight: 1.3 }}
              >
                {letters[i]}
              </span>
            ))}

            {ready && layout.map((l, i) => {
              const fixed = i === 0 || i === letters.length - 1;
              return (
                <span
                  key={`${word}-${i}`}
                  ref={(el) => { letterEls.current[i] = el; }}
                  onPointerDown={(e) => onPointerDown(e, i)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  className={cn(
                    'absolute top-0 touch-none',
                    fixed ? 'text-foreground/60' : 'cursor-ew-resize text-foreground',
                    !fixed && active === i && revealed === null && 'underline decoration-primary decoration-4 underline-offset-8'
                  )}
                  style={{ left: l.x, transform: `translateX(${offsets[i] ?? 0}px)`, fontFamily: stack(font), fontSize: size, lineHeight: 1.3 }}
                >
                  {letters[i]}
                </span>
              );
            })}
          </div>

          <div className="text-[13px] text-muted-foreground" style={{ fontFamily: stack(font) }}>Set in {font}</div>

          {revealed === null ? (
            <button onClick={submit} disabled={!ready} className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2 disabled:opacity-50">
              <Eye size={16} /> Check spacing
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="text-[44px] font-bold tabular-nums leading-none">{revealed}</div>
              <div className="text-[13px] text-muted-foreground">Faint letters show the font’s own spacing.</div>
              <button onClick={next} className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2">
                {game.round + 1 < game.words.length ? 'Next word' : 'See results'} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
