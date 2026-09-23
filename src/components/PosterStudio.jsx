import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Copy, ChevronUp, ChevronDown, Download, ImagePlus, Loader2 } from 'lucide-react';
import { stack, fxStyle, weightRangeFor } from '../lib/typeStyles';
import { FONT_METADATA } from '../data/fonts';
import { ARTBOARD_W, BLENDS, TEMPLATES, makeLayer, heightFor, bgCss, renderPoster } from '../lib/posterRender';
import { download } from '../lib/motionExport';
import { track } from '../lib/achievements';
import { ASPECTS } from '../lib/studio';
import useElementSize from '../hooks/useElementSize';
import ScrubField from './ScrubField';
import { StudioHeader, Group, Chip, ColorField } from './studio/StudioUI';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'jmt:poster:v1';

const loadSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* storage unavailable */ }
  return null;
};

/**
 * Poster mode — free layout with the current pair. Drag text around the
 * artboard, stack layers, rotate, outline, blend, and export a PNG.
 */
export default function PosterStudio({ primaryFont, pControls, secondaryFont, sControls, text, onExit }) {
  const [poster, setPoster] = useState(() => loadSaved() ?? TEMPLATES[0].make(text));
  const [selectedId, setSelectedId] = useState(() => poster.layers[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const stageRef = useRef(null);
  const imageInput = useRef(null);
  const drag = useRef(null);

  const families = { primary: primaryFont, secondary: secondaryFont };
  const controlsFor = (role) => (role === 'primary' ? pControls : sControls);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(poster)); } catch { /* too big or unavailable */ }
  }, [poster]);

  const W = ARTBOARD_W;
  const H = heightFor(poster.aspect);
  const box = useElementSize(stageRef);
  const k = box.w ? Math.min(box.w / W, box.h / H) : 0.5;

  const selected = poster.layers.find((l) => l.id === selectedId) ?? null;

  const update = (id, patch) =>
    setPoster((p) => ({ ...p, layers: p.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  const setBg = (patch) => setPoster((p) => ({ ...p, bg: { ...p.bg, ...patch } }));

  const addLayer = () => {
    // White text on a dark background, black on a light one.
    const hexBg = /^#[0-9a-f]{6}$/i.test(poster.bg.a) ? poster.bg.a : '#ffffff';
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hexBg.slice(i, i + 2), 16));
    const dark = 0.299 * r + 0.587 * g + 0.114 * b < 140;
    const layer = makeLayer({ text: 'New text', color: dark ? '#ffffff' : '#111111' });
    setPoster((p) => ({ ...p, layers: [...p.layers, layer] }));
    setSelectedId(layer.id);
  };

  const removeLayer = (id) => {
    setPoster((p) => ({ ...p, layers: p.layers.filter((l) => l.id !== id) }));
    setSelectedId(null);
  };

  const duplicate = (id) => {
    const src = poster.layers.find((l) => l.id === id);
    if (!src) return;
    const copy = makeLayer({ ...src, id: undefined, x: Math.min(0.95, src.x + 0.03), y: Math.min(0.95, src.y + 0.03) });
    setPoster((p) => ({ ...p, layers: [...p.layers, copy] }));
    setSelectedId(copy.id);
  };

  const move = (id, dir) =>
    setPoster((p) => {
      const i = p.layers.findIndex((l) => l.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.layers.length) return p;
      const layers = [...p.layers];
      [layers[i], layers[j]] = [layers[j], layers[i]];
      return { ...p, layers };
    });

  const applyTemplate = (tpl) => {
    const next = tpl.make(text);
    setPoster(next);
    setSelectedId(next.layers[0]?.id ?? null);
  };

  // Keyboard: nudge with arrows (Shift = 10×), Delete removes.
  useEffect(() => {
    const onKey = (e) => {
      if (!selected) return;
      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      const step = (e.shiftKey ? 10 : 1) / W;
      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step * (W / H)], ArrowDown: [0, step * (W / H)] }[e.key];
      if (d) { e.preventDefault(); update(selected.id, { x: selected.x + d[0], y: selected.y + d[1] }); }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeLayer(selected.id); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onPointerDown = (e, layer) => {
    e.stopPropagation();
    setSelectedId(layer.id);
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: layer.id, sx: e.clientX, sy: e.clientY, x: layer.x, y: layer.y };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    update(d.id, { x: d.x + (e.clientX - d.sx) / (k * W), y: d.y + (e.clientY - d.sy) / (k * H) });
  };
  const onPointerUp = () => { drag.current = null; };

  const onImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBg({ type: 'image', image: reader.result });
    reader.readAsDataURL(file);
  };

  const exportPng = async (scale) => {
    setBusy(true);
    try {
      const canvas = await renderPoster(poster, families, scale);
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
      download(blob, `poster-${primaryFont}-${secondaryFont}.png`.toLowerCase().replace(/\s+/g, '-'));
      track('poster-export');
    } finally {
      setBusy(false);
    }
  };

  const weightField = (layer) => {
    const family = families[layer.role];
    const range = weightRangeFor(family);
    if (range) {
      return <ScrubField label="Weight" value={layer.weight} min={range[0]} max={range[1]} step={1} sensitivity={0.6} onChange={(v) => update(layer.id, { weight: v })} />;
    }
    const ws = FONT_METADATA.find((m) => m.family === family)?.weights ?? [400];
    const value = ws.includes(layer.weight) ? layer.weight : ws[0];
    return <ScrubField label="Weight" values={ws} value={value} sensitivity={10} disabled={ws.length === 1} onChange={(v) => update(layer.id, { weight: v })} />;
  };

  return (
    <div className="fixed inset-0 z-[90] bg-background text-foreground flex flex-col">
      <StudioHeader title="Poster" subtitle={`${primaryFont} + ${secondaryFont}`} onExit={onExit}>
        <button
          onClick={() => exportPng(2)}
          disabled={busy}
          className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-2 disabled:opacity-60"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          <span className="hidden sm:inline">Export PNG</span>
        </button>
      </StudioHeader>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div
          ref={stageRef}
          className="flex-1 min-h-[55vh] lg:min-h-0 m-3 sm:m-6 flex items-center justify-center overflow-hidden"
          onPointerDown={() => setSelectedId(null)}
        >
          <div style={{ width: W * k, height: H * k }} className="relative shadow-2xl">
            <div
              className="absolute left-0 top-0 overflow-hidden [isolation:isolate]"
              style={{ width: W, height: H, transform: `scale(${k})`, transformOrigin: '0 0', ...bgCss(poster.bg) }}
            >
              {poster.layers.map((l) => {
                const c = controlsFor(l.role);
                return (
                  <div
                    key={l.id}
                    onPointerDown={(e) => onPointerDown(e, l)}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    className="absolute cursor-move select-none"
                    style={{
                      left: l.x * W,
                      top: l.y * H,
                      transform: `translate(-50%, -50%) rotate(${l.rotation}deg)`,
                      fontFamily: stack(families[l.role]),
                      ...fxStyle(families[l.role], c),
                      fontSize: l.size,
                      fontWeight: l.weight,
                      lineHeight: l.lh,
                      letterSpacing: `${l.ls}em`,
                      whiteSpace: 'pre',
                      textAlign: l.align,
                      textTransform: l.upper ? 'uppercase' : 'none',
                      color: l.fill ? l.color : 'transparent',
                      WebkitTextStroke: l.stroke > 0 ? `${l.stroke}px ${l.strokeColor}` : undefined,
                      opacity: l.opacity,
                      mixBlendMode: l.blend,
                      outline: l.id === selectedId ? `${2 / k}px dashed hsl(var(--primary))` : 'none',
                      outlineOffset: 4 / k,
                    }}
                  >
                    {l.text || ' '}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="lg:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l border-border overflow-y-auto p-4 sm:p-5 flex flex-col gap-6 bg-background">
          <Group title="Template">
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((t) => <Chip key={t.id} onClick={() => applyTemplate(t)}>{t.label}</Chip>)}
            </div>
          </Group>

          <Group title="Canvas">
            <div className="flex flex-wrap gap-1.5">
              {ASPECTS.filter((a) => a.id !== 'fit').map((a) => (
                <Chip key={a.id} active={poster.aspect === a.id} onClick={() => setPoster((p) => ({ ...p, aspect: a.id }))}>{a.label}</Chip>
              ))}
            </div>
            <div className="flex gap-1.5">
              {['solid', 'gradient', 'image'].map((t) => (
                <Chip key={t} active={poster.bg.type === t} onClick={() => (t === 'image' && !poster.bg.image ? imageInput.current?.click() : setBg({ type: t }))} className="capitalize">{t}</Chip>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ColorField label={poster.bg.type === 'gradient' ? 'From' : 'Fill'} value={poster.bg.a} onChange={(v) => setBg({ a: v })} />
              {poster.bg.type === 'gradient' && <ColorField label="To" value={poster.bg.b} onChange={(v) => setBg({ b: v })} />}
              {poster.bg.type === 'gradient' && (
                <ScrubField label="Angle" suffix="°" value={poster.bg.angle} min={0} max={360} step={1} sensitivity={1} onChange={(v) => setBg({ angle: v })} />
              )}
            </div>
            {poster.bg.type === 'image' && (
              <button onClick={() => imageInput.current?.click()} className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground">
                <ImagePlus size={14} /> Replace image
              </button>
            )}
            <input ref={imageInput} type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e.target.files?.[0])} />
          </Group>

          <Group
            title="Layers"
            aside={
              <button onClick={addLayer} className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                <Plus size={13} /> Add text
              </button>
            }
          >
            <div className="flex flex-col gap-1">
              {[...poster.layers].reverse().map((l) => (
                <div
                  key={l.id}
                  className={cn('flex items-center gap-1 rounded-lg border px-2 py-1.5', l.id === selectedId ? 'border-primary bg-primary/5' : 'border-border')}
                >
                  <button onClick={() => setSelectedId(l.id)} className="flex-1 min-w-0 text-left text-[13px] truncate" style={{ fontFamily: stack(families[l.role]) }}>
                    {l.text.replace(/\n/g, ' ') || '(empty)'}
                  </button>
                  <button onClick={() => move(l.id, 1)} aria-label="Bring forward" className="p-1 rounded hover:bg-muted text-muted-foreground"><ChevronUp size={13} /></button>
                  <button onClick={() => move(l.id, -1)} aria-label="Send backward" className="p-1 rounded hover:bg-muted text-muted-foreground"><ChevronDown size={13} /></button>
                  <button onClick={() => duplicate(l.id)} aria-label="Duplicate layer" className="p-1 rounded hover:bg-muted text-muted-foreground"><Copy size={12} /></button>
                  <button onClick={() => removeLayer(l.id)} aria-label="Delete layer" className="p-1 rounded hover:bg-muted text-muted-foreground"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          </Group>

          {selected ? (
            <Group title="Selected text">
              <textarea
                value={selected.text}
                onChange={(e) => update(selected.id, { text: e.target.value })}
                rows={2}
                aria-label="Layer text"
                className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-1.5">
                <Chip active={selected.role === 'primary'} onClick={() => update(selected.id, { role: 'primary' })} className="flex-1 truncate">{primaryFont}</Chip>
                <Chip active={selected.role === 'secondary'} onClick={() => update(selected.id, { role: 'secondary' })} className="flex-1 truncate">{secondaryFont}</Chip>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ScrubField label="Size" value={selected.size} min={8} max={1200} step={1} sensitivity={1} onChange={(v) => update(selected.id, { size: v })} />
                {weightField(selected)}
                <ScrubField label="Line" value={selected.lh} min={0.6} max={2.5} step={0.01} precision={2} sensitivity={4} onChange={(v) => update(selected.id, { lh: v })} />
                <ScrubField label="Letter" value={selected.ls} min={-0.2} max={1} step={0.01} precision={2} sensitivity={6} onChange={(v) => update(selected.id, { ls: v })} />
                <ScrubField label="Rotate" suffix="°" value={selected.rotation} min={-180} max={180} step={1} sensitivity={1} onChange={(v) => update(selected.id, { rotation: v })} />
                <ScrubField label="Opacity" value={selected.opacity} min={0} max={1} step={0.01} precision={2} sensitivity={3} onChange={(v) => update(selected.id, { opacity: v })} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['left', 'center', 'right'].map((a) => (
                  <Chip key={a} active={selected.align === a} onClick={() => update(selected.id, { align: a })} className="capitalize">{a}</Chip>
                ))}
                <Chip active={selected.upper} onClick={() => update(selected.id, { upper: !selected.upper })}>AA</Chip>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ColorField label="Fill" value={selected.color} onChange={(v) => update(selected.id, { color: v })} />
                <Chip active={selected.fill} onClick={() => update(selected.id, { fill: !selected.fill })} className="rounded-lg">{selected.fill ? 'Filled' : 'No fill'}</Chip>
                <ColorField label="Line" value={selected.strokeColor} onChange={(v) => update(selected.id, { strokeColor: v })} />
                <ScrubField label="Outline" suffix="px" value={selected.stroke} min={0} max={30} step={0.5} precision={1} sensitivity={4} onChange={(v) => update(selected.id, { stroke: v })} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {BLENDS.map((b) => (
                  <Chip key={b} active={selected.blend === b} onClick={() => update(selected.id, { blend: b })} className="capitalize">{b}</Chip>
                ))}
              </div>
            </Group>
          ) : (
            <p className="text-[12px] text-muted-foreground">Click text on the poster to edit it. Drag to move; arrow keys nudge.</p>
          )}

          <Group title="Export">
            <div className="flex gap-1.5">
              <Chip onClick={() => exportPng(2)} disabled={busy}>PNG 2000px</Chip>
              <Chip onClick={() => exportPng(4)} disabled={busy}>PNG 4000px</Chip>
            </div>
          </Group>
        </aside>
      </div>
    </div>
  );
}
