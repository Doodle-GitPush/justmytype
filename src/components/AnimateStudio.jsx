import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Pause, Play, Download, Loader2, X, RotateCcw } from 'lucide-react';
import { gsap, useGSAP, SplitText, prefersReducedMotion } from '@/lib/gsap';
import { KINETIC_EFFECTS, KINETIC_EFFECT_ORDER, defaultParams } from '../lib/kineticEffects';
import { stack, fxStyle } from '../lib/typeStyles';
import { recordVideo, recordGif, snapshotPng, download, videoFormat } from '../lib/motionExport';
import { track } from '../lib/achievements';
import ScrubField from './ScrubField';
import { cn } from '@/lib/utils';

const PALETTES = [
  { id: 'theme', label: 'Theme', bg: 'hsl(var(--background))', fg: 'hsl(var(--foreground))' },
  { id: 'paper', label: 'Paper', bg: '#f4efe6', fg: '#1b1a17' },
  { id: 'night', label: 'Night', bg: '#0b0b10', fg: '#f5f5f7' },
  { id: 'accent', label: 'Accent', bg: '#ff4d00', fg: '#fff7f0' },
  { id: 'acid', label: 'Acid', bg: '#d7ff3a', fg: '#111111' },
  { id: 'ocean', label: 'Ocean', bg: '#0b3d91', fg: '#e3f0ff' },
  { id: 'blush', label: 'Blush', bg: '#ffd9e0', fg: '#7a1030' },
];

const ASPECTS = [
  { id: 'fit', label: 'Fit' },
  { id: '1/1', label: '1:1' },
  { id: '4/5', label: '4:5' },
  { id: '9/16', label: '9:16' },
  { id: '16/9', label: '16:9' },
];

function Group({ title, children, aside }) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Chip({ active, onClick, children, className, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors',
        active ? 'bg-primary text-primary-foreground border-primary' : 'text-foreground border-border hover:bg-muted',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Animate — a full-screen kinetic-typography studio. Pick an effect, tune
 * its parameters and speed, choose the face, colours and canvas shape,
 * then export the motion as video, GIF or a still.
 */
export default function AnimateStudio({ primaryFont, pControls, secondaryFont, sControls, text: initialText, onExit }) {
  const frameRef = useRef(null);
  const wordRef = useRef(null);
  const stageRef = useRef(null);

  const [styleKey, setStyleKey] = useState('circle');
  const [paramsBy, setParamsBy] = useState(() =>
    Object.fromEntries(KINETIC_EFFECT_ORDER.map((k) => [k, defaultParams(k)]))
  );
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [text, setText] = useState(initialText);
  const [role, setRole] = useState('primary');
  const [size, setSize] = useState(110);
  const [paletteId, setPaletteId] = useState('theme');
  const [aspect, setAspect] = useState('fit');

  const [format, setFormat] = useState(() => (videoFormat() ? 'video' : 'gif'));
  const [seconds, setSeconds] = useState(5);
  const [job, setJob] = useState(null); // { progress, label } while exporting
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const font = role === 'primary' ? primaryFont : secondaryFont;
  const controls = role === 'primary' ? pControls : sControls;
  const params = paramsBy[styleKey];
  const palette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0];
  const reduced = prefersReducedMotion();

  // The frame takes the chosen aspect ratio, as large as the stage allows.
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const frameSize = (() => {
    if (aspect === 'fit' || !box.w) return { width: '100%', height: '100%' };
    const [aw, ah] = aspect.split('/').map(Number);
    const ratio = aw / ah;
    const w = Math.min(box.w, box.h * ratio);
    return { width: `${Math.floor(w)}px`, height: `${Math.floor(w / ratio)}px` };
  })();

  // Holds whatever the currently-live effect created — not state, since
  // nothing here should re-render off it, just be torn down by it.
  const activeRef = useRef({ tween: null, split: null });

  const teardown = () => {
    activeRef.current.tween?.kill();
    const word = wordRef.current;
    // Only the props effects set on the word element itself — NOT 'all'.
    // clearProps:'all' would also strip the element's own inline font
    // styles, and React wouldn't reapply them (its virtual DOM didn't
    // change), so the headline would silently fall back to the default font.
    if (word) gsap.set(word, { clearProps: 'rotation,scale,x,y,width,height,transformOrigin' });
    activeRef.current.split?.revert();
    activeRef.current = { tween: null, split: null };
  };

  useGSAP(() => {
    if (reduced) return;
    gsap.fromTo(stageRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
  }, []);

  useEffect(() => { track('effect', { id: styleKey }); }, [styleKey]);

  useGSAP(
    () => {
      // Tear down explicitly on every entry, not just on exit, so there's
      // never a moment where two effects' tweens share an element.
      teardown();

      const word = wordRef.current;
      if (!word || !word.textContent.trim() || reduced) return;

      const effect = KINETIC_EFFECTS[styleKey] ?? KINETIC_EFFECTS.circle;
      // autoSplit re-splits once the webfont swaps in (so the letters are
      // measured in the real face) — each re-split rebuilds the effect.
      const split = SplitText.create(word, {
        type: 'chars',
        autoSplit: true,
        onSplit: (self) => {
          activeRef.current.tween?.kill();
          const tween = effect.build(self.chars, word, params, frameRef.current);
          tween?.timeScale?.(speed);
          if (!playing) tween?.pause?.();
          activeRef.current.tween = tween;
        },
      });
      activeRef.current.split = split;

      return teardown;
    },
    { dependencies: [styleKey, text, font, controls.weight, size, JSON.stringify(params)], revertOnUpdate: true }
  );

  useEffect(() => { activeRef.current.tween?.timeScale?.(speed); }, [speed]);
  useEffect(() => {
    const t = activeRef.current.tween;
    if (playing) t?.resume?.(); else t?.pause?.();
  }, [playing]);

  // Safety net for unmount (e.g. Back mid-animation).
  useEffect(() => () => { teardown(); abortRef.current?.abort(); }, []);

  const setParam = (key, value) =>
    setParamsBy((all) => ({ ...all, [styleKey]: { ...all[styleKey], [key]: value } }));

  const runExport = async () => {
    setError(null);
    const frame = frameRef.current;
    const getChars = () => activeRef.current.split?.chars ?? [];
    const slug = `${font}-${KINETIC_EFFECTS[styleKey].label}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const controller = new AbortController();
    abortRef.current = controller;
    setPlaying(true);

    try {
      if (format === 'png') {
        const blob = await snapshotPng({ frame, getChars });
        download(blob, `${slug}.png`);
      } else if (format === 'gif') {
        setJob({ progress: 0, label: 'Recording GIF' });
        const blob = await recordGif({
          frame, getChars, seconds, signal: controller.signal,
          onProgress: (p) => setJob({ progress: p, label: 'Recording GIF' }),
        });
        download(blob, `${slug}.gif`);
      } else {
        setJob({ progress: 0, label: 'Recording video' });
        const { blob, ext } = await recordVideo({
          frame, getChars, seconds, signal: controller.signal,
          onProgress: (p) => setJob({ progress: p, label: 'Recording video' }),
        });
        download(blob, `${slug}.${ext}`);
      }
      track('motion-export');
    } catch (e) {
      if (e?.name !== 'AbortError') setError(e?.message || 'Export failed.');
    } finally {
      setJob(null);
      abortRef.current = null;
    }
  };

  const frameStyle = { background: palette.bg, color: palette.fg, ...frameSize };

  const videoExt = videoFormat()?.ext?.toUpperCase();

  return (
    <div className="fixed inset-0 z-[90] bg-background text-foreground flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border shrink-0">
        <button
          onClick={onExit}
          className="flex items-center gap-2 bg-background/80 backdrop-blur border border-border px-4 py-2 rounded-full text-[13px] font-semibold shadow-sm transition-all hover:bg-card text-foreground"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back to editor</span>
        </button>
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground truncate">
          <span className="hidden sm:inline">Animate</span>
          <span className="text-foreground font-medium truncate max-w-[40vw]" style={{ fontFamily: stack(font) }}>{font}</span>
        </div>
        <button
          onClick={() => setPlaying((v) => !v)}
          aria-label={playing ? 'Pause' : 'Play'}
          className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted"
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div ref={stageRef} className="flex-1 min-h-[52vh] lg:min-h-0 p-3 sm:p-6 flex items-center justify-center overflow-hidden bg-muted/40">
          <div
            ref={frameRef}
            className="relative overflow-hidden flex items-center justify-center rounded-xl shadow-sm transition-[background-color,color] duration-300"
            style={frameStyle}
          >
            {reduced && (
              <div className="absolute top-3 inset-x-3 text-center text-[12px] opacity-70">
                Animation is off because your system prefers reduced motion.
              </div>
            )}
            <div
              key={`${text}|${font}`}
              ref={wordRef}
              className="relative max-w-[92%] text-center tracking-tight [text-wrap:balance]"
              style={{
                fontFamily: stack(font),
                fontWeight: controls.weight,
                fontSize: `min(${size}px, ${size / 11}vw)`,
                lineHeight: 1.15,
                letterSpacing: `${controls.ls}em`,
                ...fxStyle(font, controls),
              }}
            >
              {text}
            </div>
          </div>
        </div>

        <aside className="lg:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l border-border overflow-y-auto p-4 sm:p-5 flex flex-col gap-6 bg-background">
          <Group title="Effect">
            <div className="grid grid-cols-3 gap-1.5">
              {KINETIC_EFFECT_ORDER.map((key) => (
                <Chip key={key} active={styleKey === key} onClick={() => setStyleKey(key)} className="rounded-xl px-2">
                  {KINETIC_EFFECTS[key].label}
                </Chip>
              ))}
            </div>
          </Group>

          <Group
            title="Settings"
            aside={
              <button
                onClick={() => { setParamsBy((all) => ({ ...all, [styleKey]: defaultParams(styleKey) })); setSpeed(1); }}
                aria-label="Reset settings"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <RotateCcw size={12} />
              </button>
            }
          >
            <div className="grid grid-cols-2 gap-2">
              <ScrubField label="Speed" suffix="×" value={speed} min={0.1} max={4} step={0.05} precision={2} sensitivity={4} onChange={setSpeed} />
              {KINETIC_EFFECTS[styleKey].params.map(([key, label, min, max, step]) => (
                <ScrubField
                  key={`${styleKey}-${key}`}
                  label={label}
                  value={params[key]}
                  min={min} max={max} step={step}
                  precision={step < 1 ? (step < 0.1 ? 2 : 1) : 0}
                  sensitivity={Math.max(0.5, 180 / ((max - min) / step))}
                  onChange={(v) => setParam(key, v)}
                />
              ))}
            </div>
            {styleKey === 'magnet' && <p className="text-[11px] text-muted-foreground">Move your pointer over the stage — letters shy away.</p>}
          </Group>

          <Group title="Type">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              aria-label="Animated text"
              className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-1.5">
              <Chip active={role === 'primary'} onClick={() => setRole('primary')} className="flex-1 truncate">{primaryFont}</Chip>
              <Chip active={role === 'secondary'} onClick={() => setRole('secondary')} className="flex-1 truncate">{secondaryFont}</Chip>
            </div>
            <ScrubField label="Size" suffix="px" value={size} min={24} max={260} step={1} sensitivity={2} onChange={setSize} />
          </Group>

          <Group title="Colour">
            <div className="flex flex-wrap gap-2">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPaletteId(p.id)}
                  aria-pressed={paletteId === p.id}
                  aria-label={p.label}
                  title={p.label}
                  className={cn('w-9 h-9 rounded-full border-2 flex items-center justify-center text-[13px] font-bold transition-transform', paletteId === p.id ? 'border-primary scale-110' : 'border-border')}
                  style={{ background: p.bg, color: p.fg }}
                >
                  Aa
                </button>
              ))}
            </div>
          </Group>

          <Group title="Canvas">
            <div className="flex flex-wrap gap-1.5">
              {ASPECTS.map((a) => <Chip key={a.id} active={aspect === a.id} onClick={() => setAspect(a.id)}>{a.label}</Chip>)}
            </div>
          </Group>

          <Group title="Export">
            <div className="flex gap-1.5">
              {videoExt && <Chip active={format === 'video'} onClick={() => setFormat('video')}>{videoExt}</Chip>}
              <Chip active={format === 'gif'} onClick={() => setFormat('gif')}>GIF</Chip>
              <Chip active={format === 'png'} onClick={() => setFormat('png')}>PNG still</Chip>
            </div>
            {format !== 'png' && (
              <div className="flex gap-1.5 items-center">
                <span className="text-[12px] text-muted-foreground mr-1">Length</span>
                {[3, 5, 8].map((s) => <Chip key={s} active={seconds === s} onClick={() => setSeconds(s)}>{s}s</Chip>)}
              </div>
            )}
            {job ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-10 rounded-xl bg-muted overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 bg-primary/25 transition-[width] duration-150" style={{ width: `${Math.round(job.progress * 100)}%` }} />
                  <div className="relative h-full flex items-center justify-center gap-2 text-[13px] font-medium">
                    <Loader2 size={14} className="animate-spin" /> {job.label} · {Math.round(job.progress * 100)}%
                  </div>
                </div>
                <button onClick={() => abortRef.current?.abort()} aria-label="Cancel export" className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={runExport}
                disabled={reduced && format !== 'png'}
                className="h-10 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-primary/95 disabled:opacity-50"
              >
                <Download size={15} /> Export {format === 'video' ? videoExt : format === 'gif' ? 'GIF' : 'PNG'}
              </button>
            )}
            {error && <p className="text-[12px] text-destructive">{error}</p>}
            <p className="text-[11px] text-muted-foreground leading-snug">
              Records in real time from the stage above. Variable-axis tweaks other than weight aren’t carried into exports.
            </p>
          </Group>
        </aside>
      </div>
    </div>
  );
}
