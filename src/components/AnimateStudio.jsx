import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Download, Loader2, X, RotateCcw } from 'lucide-react';
import { gsap, useGSAP, SplitText, prefersReducedMotion } from '@/lib/gsap';
import { KINETIC_EFFECTS, KINETIC_EFFECT_ORDER, defaultParams } from '../lib/kineticEffects';
import { stack, fxStyle } from '../lib/typeStyles';
import { recordVideo, recordGif, snapshotPng, download, videoFormat } from '../lib/motionExport';
import { track } from '../lib/achievements';
import ScrubField from './ScrubField';
import { StudioHeader, StudioPanel, Group, Chip, Swatches, Segmented, stageClass } from './studio/StudioUI';
import useElementSize from '../hooks/useElementSize';
import { PALETTES, ASPECTS, ratioOf, fitBox } from '../lib/studio';

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
  const box = useElementSize(stageRef);
  const frameSize = (() => {
    if (aspect === 'fit' || !box.w) return { width: '100%', height: '100%' };
    const { w, h } = fitBox(box, ratioOf(aspect));
    return { width: `${w}px`, height: `${h}px` };
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
      <StudioHeader title="Animate" subtitle={font} subtitleStyle={{ fontFamily: stack(font) }} onExit={onExit}>
        <button
          onClick={() => setPlaying((v) => !v)}
          aria-label={playing ? 'Pause' : 'Play'}
          className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted"
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </StudioHeader>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div ref={stageRef} className={`${stageClass} p-3 sm:p-6 flex items-center justify-center overflow-hidden`}>
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

        <StudioPanel
          footer={
            <>
              <div className="flex items-center gap-2">
                <Segmented
                  className="flex-1"
                  value={format}
                  onChange={setFormat}
                  options={[
                    ...(videoExt ? [{ id: 'video', label: videoExt }] : []),
                    { id: 'gif', label: 'GIF' },
                    { id: 'png', label: 'PNG' },
                  ]}
                />
                {format !== 'png' && (
                  <Segmented
                    value={seconds}
                    onChange={setSeconds}
                    options={[3, 5, 8].map((n) => ({ id: n, label: `${n}s` }))}
                  />
                )}
              </div>
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
            </>
          }
        >
          <Group title="Effect">
            <div className="grid grid-cols-3 gap-1.5">
              {KINETIC_EFFECT_ORDER.map((key) => (
                <Chip key={key} active={styleKey === key} onClick={() => setStyleKey(key)} className="rounded-lg px-2 py-2">
                  {KINETIC_EFFECTS[key].label}
                </Chip>
              ))}
            </div>
          </Group>

          <Group
            title={`${KINETIC_EFFECTS[styleKey].label} settings`}
            aside={
              <button
                onClick={() => { setParamsBy((all) => ({ ...all, [styleKey]: defaultParams(styleKey) })); setSpeed(1); }}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <RotateCcw size={11} /> Reset
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
            <Segmented
              value={role}
              onChange={setRole}
              options={[
                { id: 'primary', label: primaryFont, style: { fontFamily: stack(primaryFont) } },
                { id: 'secondary', label: secondaryFont, style: { fontFamily: stack(secondaryFont) } },
              ]}
            />
            <ScrubField label="Size" suffix="px" value={size} min={24} max={260} step={1} sensitivity={2} onChange={setSize} />
          </Group>

          <Group title="Look">
            <Swatches palettes={PALETTES} value={paletteId} onChange={setPaletteId} />
            <Segmented value={aspect} onChange={setAspect} options={ASPECTS} />
          </Group>
        </StudioPanel>
      </div>
    </div>
  );
}
