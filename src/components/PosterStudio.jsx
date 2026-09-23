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
import { StudioHeader, StudioPanel, Group, Chip, ColorField, Segmented, stageClass } from './studio/StudioUI';
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
  const [tab, setTab] = useState('poster');
  const [exportScale, setExportScale] = useState(2);
  // Selecting a layer (on the artboard or in the list) jumps to its settings.
  const select = (id) => {
    setSelectedId(id);
    if (id) setTab('text');
  };
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
    select(layer.id);
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
    select(copy.id);
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
    select(layer.id);
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
      <StudioHeader title="Poster" subtitle={`${primaryFont} + ${secondaryFont}`} onExit={onExit} />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div
          ref={stageRef}
          className={`${stageClass} p-3 sm:p-6 flex items-center justify-center overflow-hidden`}
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

        <StudioPanel
          top={
            <Segmented
              value={tab}
              onChange={setTab}
              options={[{ id: 'poster', label: 'Poster' }, { id: 'text', label: 'Text', badge: poster.layers.length }]}
            />
          }
          footer={
            <div className="flex items-center gap-2">
              <Segmented
                className="flex-1"
                value={exportScale}
                onChange={setExportScale}
                options={[{ id: 2, label: '2000 px' }, { id: 4, label: '4000 px' }]}
              />
              <button
                onClick={() => exportPng(exportScale)}
                disabled={busy}
                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-2 disabled:opacity-60"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} PNG
              </button>
            </div>
          }
        >
          {tab === 'poster' ? (
            <>
              <Group title="Start from a template">
                <div className="grid grid-cols-3 gap-1.5">
                  {TEMPLATES.map((t) => <Chip key={t.id} onClick={() => applyTemplate(t)} className="rounded-lg py-2">{t.label}</Chip>)}
                </div>
              </Group>

              <Group title="Size">
                <Segmented
                  value={poster.aspect}
                  onChange={(id) => setPoster((p) => ({ ...p, aspect: id }))}
                  options={ASPECTS.filter((a) => a.id !== 'fit')}
                />
              </Group>

              <Group title="Background">
                <Segmented
                  value={poster.bg.type}
                  onChange={(t) => (t === 'image' && !poster.bg.image ? imageInput.current?.click() : setBg({ type: t }))}
                  options={[{ id: 'solid', label: 'Solid' }, { id: 'gradient', label: 'Gradient' }, { id: 'image', label: 'Image' }]}
                />
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
            </>
          ) : (
            <>
              <Group
                title="Layers"
                aside={
                  <button onClick={addLayer} className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80">
                    <Plus size={13} /> Add text
                  </button>
                }
              >
                <div className="flex flex-col rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {[...poster.layers].reverse().map((l) => (
                    <div
                      key={l.id}
                      className={cn('group flex items-center gap-0.5 pl-3 pr-1 h-10 transition-colors', l.id === selectedId ? 'bg-primary/10' : 'hover:bg-muted/60')}
                    >
                      <button onClick={() => setSelectedId(l.id)} className="flex-1 min-w-0 text-left text-[13px] truncate" style={{ fontFamily: stack(families[l.role]) }}>
                        {l.text.replace(/\n/g, ' ') || '(empty)'}
                      </button>
                      <div className={cn('flex items-center transition-opacity', l.id === selectedId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100')}>
                        <button onClick={() => move(l.id, 1)} aria-label="Bring forward" className="p-1.5 rounded-md hover:bg-background text-muted-foreground"><ChevronUp size={13} /></button>
                        <button onClick={() => move(l.id, -1)} aria-label="Send backward" className="p-1.5 rounded-md hover:bg-background text-muted-foreground"><ChevronDown size={13} /></button>
                        <button onClick={() => duplicate(l.id)} aria-label="Duplicate layer" className="p-1.5 rounded-md hover:bg-background text-muted-foreground"><Copy size={12} /></button>
                        <button onClick={() => removeLayer(l.id)} aria-label="Delete layer" className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                  {!poster.layers.length && <div className="px-3 py-3 text-[12px] text-muted-foreground">No text yet.</div>}
                </div>
              </Group>

              {selected ? (
                <>
                  <Group title="Content">
                    <textarea
                      value={selected.text}
                      onChange={(e) => update(selected.id, { text: e.target.value })}
                      rows={2}
                      aria-label="Layer text"
                      className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <Segmented
                      value={selected.role}
                      onChange={(role) => update(selected.id, { role })}
                      options={[
                        { id: 'primary', label: primaryFont, style: { fontFamily: stack(primaryFont) } },
                        { id: 'secondary', label: secondaryFont, style: { fontFamily: stack(secondaryFont) } },
                      ]}
                    />
                  </Group>

                  <Group title="Typography">
                    <div className="grid grid-cols-2 gap-2">
                      <ScrubField label="Size" value={selected.size} min={8} max={1200} step={1} sensitivity={1} onChange={(v) => update(selected.id, { size: v })} />
                      {weightField(selected)}
                      <ScrubField label="Line" value={selected.lh} min={0.6} max={2.5} step={0.01} precision={2} sensitivity={4} onChange={(v) => update(selected.id, { lh: v })} />
                      <ScrubField label="Letter" value={selected.ls} min={-0.2} max={1} step={0.01} precision={2} sensitivity={6} onChange={(v) => update(selected.id, { ls: v })} />
                    </div>
                    <div className="flex gap-2">
                      <Segmented
                        className="flex-1"
                        value={selected.align}
                        onChange={(align) => update(selected.id, { align })}
                        options={[{ id: 'left', label: 'Left' }, { id: 'center', label: 'Center' }, { id: 'right', label: 'Right' }]}
                      />
                      <Chip active={selected.upper} onClick={() => update(selected.id, { upper: !selected.upper })} className="rounded-xl" title="Uppercase">AA</Chip>
                    </div>
                  </Group>

                  <Group title="Transform">
                    <div className="grid grid-cols-2 gap-2">
                      <ScrubField label="Rotate" suffix="°" value={selected.rotation} min={-180} max={180} step={1} sensitivity={1} onChange={(v) => update(selected.id, { rotation: v })} />
                      <ScrubField label="Opacity" value={selected.opacity} min={0} max={1} step={0.01} precision={2} sensitivity={3} onChange={(v) => update(selected.id, { opacity: v })} />
                    </div>
                  </Group>

                  <Group
                    title="Fill & outline"
                    aside={
                      <button onClick={() => update(selected.id, { fill: !selected.fill })} className="text-[11px] text-muted-foreground hover:text-foreground">
                        {selected.fill ? 'Remove fill' : 'Add fill'}
                      </button>
                    }
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <ColorField label="Fill" value={selected.color} onChange={(v) => update(selected.id, { color: v, fill: true })} />
                      <ColorField label="Line" value={selected.strokeColor} onChange={(v) => update(selected.id, { strokeColor: v })} />
                    </div>
                    <ScrubField label="Outline" suffix="px" value={selected.stroke} min={0} max={30} step={0.5} precision={1} sensitivity={4} onChange={(v) => update(selected.id, { stroke: v })} />
                  </Group>

                  <Group title="Blend">
                    <div className="grid grid-cols-3 gap-1.5">
                      {BLENDS.map((b) => (
                        <Chip key={b} active={selected.blend === b} onClick={() => update(selected.id, { blend: b })} className="capitalize rounded-lg px-1">{b}</Chip>
                      ))}
                    </div>
                  </Group>
                </>
              ) : (
                <p className="py-5 text-[12px] text-muted-foreground leading-relaxed">
                  Select text on the poster or in the list to edit it. Drag to move, arrow keys nudge, Delete removes.
                </p>
              )}
            </>
          )}
        </StudioPanel>
      </div>
    </div>
  );
}
