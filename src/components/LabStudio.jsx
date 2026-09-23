import { useEffect, useRef, useState } from 'react';
import { Shuffle, Download, RotateCcw } from 'lucide-react';
import { stack } from '../lib/typeStyles';
import { LAB_MODES, LAB_ORDER, LAB_W, labDefaults, drawLab } from '../lib/letterLab';
import { PALETTES, ASPECTS, ratioOf, fitBox, resolveColor } from '../lib/studio';
import { download } from '../lib/motionExport';
import { track } from '../lib/achievements';
import useElementSize from '../hooks/useElementSize';
import ScrubField from './ScrubField';
import { StudioHeader, StudioPanel, Group, Chip, Swatches, Segmented, stageClass } from './studio/StudioUI';

/**
 * Letter Lab — build patterns and layouts out of letters: grids, radial
 * rings, flowing waves, words filled with tiny glyphs, echoes, scatters.
 */
export default function LabStudio({ primaryFont, pControls, secondaryFont, sControls, text, onExit }) {
  const [mode, setMode] = useState('grid');
  const [paramsBy, setParamsBy] = useState(() => Object.fromEntries(LAB_ORDER.map((m) => [m, labDefaults(m)])));
  const [glyphs, setGlyphs] = useState('Aa&g');
  const [word, setWord] = useState(() => (text.split(' ')[0] || 'Type').slice(0, 12));
  const [role, setRole] = useState('primary');
  const [paletteId, setPaletteId] = useState('paper');
  const [aspect, setAspect] = useState('1/1');
  const [seed, setSeed] = useState(7);
  const [fontsReady, setFontsReady] = useState(0);

  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const box = useElementSize(stageRef);

  const family = role === 'primary' ? primaryFont : secondaryFont;
  const weight = (role === 'primary' ? pControls : sControls).weight;
  const palette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0];
  const ratio = ratioOf(aspect);
  const H = Math.round(LAB_W / ratio);
  const p = paramsBy[mode];
  const fit = box.w ? fitBox(box, ratio) : { w: 0, h: 0 };

  // Canvas only draws with a webfont once it has actually loaded.
  useEffect(() => {
    let cancelled = false;
    document.fonts.load(`${weight} 100px ${stack(family)}`, glyphs + word)
      .catch(() => {})
      .then(() => { if (!cancelled) setFontsReady((n) => n + 1); });
    return () => { cancelled = true; };
  }, [family, weight, glyphs, word]);

  const colors = () => ({
    bg: resolveColor(palette.bg),
    ink: resolveColor(palette.fg),
    ink2: resolveColor(palette.ink2),
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fit.w) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(fit.w * dpr);
    canvas.height = Math.round(fit.h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(canvas.width / LAB_W, 0, 0, canvas.width / LAB_W, 0, 0);
    drawLab(ctx, { mode, p, glyphs, word, font: stack(family), weight, seed, colors: colors(), H });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, p, glyphs, word, family, weight, seed, paletteId, aspect, fit.w, fit.h, fontsReady]);

  const exportPng = async () => {
    const canvas = document.createElement('canvas');
    const scale = 3;
    canvas.width = LAB_W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawLab(ctx, { mode, p, glyphs, word, font: stack(family), weight, seed, colors: colors(), H });
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
    download(blob, `letter-lab-${mode}-${seed}.png`);
    track('lab-export');
  };

  const setParam = (k, v) => setParamsBy((all) => ({ ...all, [mode]: { ...all[mode], [k]: v } }));
  const usesWord = mode === 'mask' || mode === 'echo';

  return (
    <div className="fixed inset-0 z-[90] bg-background text-foreground flex flex-col">
      <StudioHeader title="Letter Lab" subtitle={family} subtitleStyle={{ fontFamily: stack(family) }} onExit={onExit} />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div ref={stageRef} className={`${stageClass} p-3 sm:p-6 flex items-center justify-center overflow-hidden`}>
          <canvas ref={canvasRef} style={{ width: fit.w, height: fit.h }} className="shadow-2xl rounded-sm" aria-label={`${LAB_MODES[mode].label} pattern`} />
        </div>

        <StudioPanel
          footer={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSeed(Math.floor(Math.random() * 1e6))}
                className="h-10 flex-1 rounded-xl border border-border text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-muted"
              >
                <Shuffle size={14} /> Shuffle
              </button>
              <button onClick={exportPng} className="h-10 flex-1 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2">
                <Download size={14} /> Export PNG
              </button>
            </div>
          }
        >
          <Group title="Pattern">
            <div className="grid grid-cols-3 gap-1.5">
              {LAB_ORDER.map((m) => <Chip key={m} active={mode === m} onClick={() => setMode(m)} className="rounded-lg py-2">{LAB_MODES[m].label}</Chip>)}
            </div>
          </Group>

          <Group title={usesWord ? 'Word' : 'Letters'}>
            {usesWord ? (
              <input
                value={word}
                onChange={(e) => setWord(e.target.value)}
                aria-label="Word"
                className="h-10 rounded-xl border border-border bg-card px-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontFamily: stack(family) }}
              />
            ) : (
              <input
                value={glyphs}
                onChange={(e) => setGlyphs(e.target.value)}
                aria-label="Letters to use"
                placeholder="Letters to repeat"
                className="h-10 rounded-xl border border-border bg-card px-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontFamily: stack(family) }}
              />
            )}
            {mode === 'mask' && (
              <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                Fill pattern with
                <input
                  value={glyphs}
                  onChange={(e) => setGlyphs(e.target.value)}
                  aria-label="Pattern letters"
                  placeholder="Pattern letters"
                  className="h-10 rounded-xl border border-border bg-card px-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                  style={{ fontFamily: stack(family) }}
                />
              </label>
            )}
            <Segmented
              value={role}
              onChange={setRole}
              options={[
                { id: 'primary', label: primaryFont, style: { fontFamily: stack(primaryFont) } },
                { id: 'secondary', label: secondaryFont, style: { fontFamily: stack(secondaryFont) } },
              ]}
            />
          </Group>

          <Group
            title={`${LAB_MODES[mode].label} settings`}
            aside={
              <button onClick={() => setParamsBy((all) => ({ ...all, [mode]: labDefaults(mode) }))} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                <RotateCcw size={11} /> Reset
              </button>
            }
          >
            <div className="grid grid-cols-2 gap-2">
              {LAB_MODES[mode].params.map(([k, label, min, max, step]) => (
                <ScrubField
                  key={`${mode}-${k}`}
                  label={label}
                  value={p[k]}
                  min={min} max={max} step={step}
                  precision={step < 1 ? (step < 0.01 ? 3 : step < 0.1 ? 2 : 1) : 0}
                  sensitivity={Math.max(0.5, 180 / ((max - min) / step))}
                  onChange={(v) => setParam(k, v)}
                />
              ))}
              <ScrubField label="Seed" value={seed} min={0} max={999999} step={1} sensitivity={4} onChange={setSeed} />
            </div>
          </Group>

          <Group title="Look">
            <Swatches palettes={PALETTES} value={paletteId} onChange={setPaletteId} />
            <Segmented value={aspect} onChange={setAspect} options={ASPECTS.filter((a) => a.id !== 'fit')} />
          </Group>
        </StudioPanel>
      </div>
    </div>
  );
}
