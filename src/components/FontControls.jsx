import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { FONT_METADATA } from '../data/fonts';
import { axesFor, axisName, weightRangeFor, OT_FEATURES, featureEnabled } from '../lib/typeStyles';
import { track } from '../lib/achievements';
import ScrubField from './ScrubField';
import { cn } from "@/lib/utils";

/** A collapsible sub-section, so axes/features don't bury the four basics. */
function Disclosure({ title, count, onReset, children }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-t border-border/60 pt-2">
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => setOpen(v => !v)}
                    aria-expanded={open}
                    className="flex-1 flex items-center gap-1.5 py-1 text-[11px] font-semibold text-foreground"
                >
                    <ChevronDown size={12} className={cn("transition-transform", open ? "rotate-0" : "-rotate-90")} />
                    {title}
                    {count !== undefined && <span className="text-muted-foreground font-medium tabular-nums">{count}</span>}
                </button>
                {onReset && open && (
                    <button
                        type="button"
                        onClick={onReset}
                        aria-label={`Reset ${title}`}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                        <RotateCcw size={11} />
                    </button>
                )}
            </div>
            {open && <div className="pt-2">{children}</div>}
        </div>
    );
}

// A readable step for an axis range: whole numbers for wide axes, finer
// for 0–1 style ones (CASL, MONO, WONK…).
const axisStep = (a) => {
    const span = a.max - a.min;
    if (span <= 1) return 0.01;
    if (span <= 20) return 0.1;
    return 1;
};

/**
 * Size / Weight / Line height / Letter spacing for one font, as Figma-style
 * scrub fields — drag the label to change, or click the number and type —
 * plus the family's variable axes and OpenType features underneath.
 *
 * `lhValue`/`setLh` are separate from `controls`/`setControls` rather than
 * reading `controls.lh` directly: the secondary font's rendered line-height
 * is actually driven by the app-wide bodyLineHeight, not its own controls.lh
 * (which exists in state but is silently overridden everywhere it paints),
 * so the caller has to say explicitly which value/setter is the real one.
 */
export default function FontControls({ font, controls, setControls, lhValue, setLh }) {
    const meta = useMemo(() => FONT_METADATA.find(m => m.family === font), [font]);

    // Only offer weights the family actually ships — or, for a family that's
    // variable in weight, the whole continuous range.
    const weights = meta?.weights?.length ? meta.weights : [400];
    const wRange = weightRangeFor(font);
    const axes = axesFor(font).filter(a => a.tag !== 'wght');

    // Keep the selected weight valid when the font changes.
    useEffect(() => {
        if (wRange) {
            const clamped = Math.min(wRange[1], Math.max(wRange[0], controls.weight));
            if (clamped !== controls.weight) setControls({ ...controls, weight: clamped });
            return;
        }
        if (!weights.includes(controls.weight)) {
            const nearest = weights.reduce((best, w) =>
                Math.abs(w - controls.weight) < Math.abs(best - controls.weight) ? w : best
            );
            setControls({ ...controls, weight: nearest });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [font]);

    // Scrubbing fires dozens of changes a second — one event per session is plenty.
    const trackedAxis = useRef(false);
    const setAxis = (tag, value) => {
        setControls({ ...controls, axes: { ...controls.axes, [tag]: value } });
        if (!trackedAxis.current) { trackedAxis.current = true; track('axis'); }
    };

    const toggleFeature = (tag) => {
        const next = !featureEnabled(controls.features, tag);
        setControls({ ...controls, features: { ...controls.features, [tag]: next } });
        track('feature', { tag });
    };

    const changedFeatures = OT_FEATURES.filter(f => featureEnabled(controls.features, f.tag) !== !!f.on).length;

    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
                <ScrubField
                    label="Size"
                    suffix="px"
                    value={controls.size}
                    min={12} max={200} step={1}
                    sensitivity={3}
                    onChange={(v) => setControls({ ...controls, size: v })}
                />

                {wRange ? (
                    <ScrubField
                        label="Weight"
                        value={controls.weight}
                        min={wRange[0]} max={wRange[1]} step={1}
                        sensitivity={0.6}
                        onChange={(v) => setControls({ ...controls, weight: v })}
                    />
                ) : (
                    <ScrubField
                        label="Weight"
                        values={weights}
                        value={controls.weight}
                        sensitivity={10}
                        disabled={weights.length === 1}
                        onChange={(v) => setControls({ ...controls, weight: v })}
                    />
                )}

                <ScrubField
                    label="Line"
                    value={lhValue}
                    min={0.8} max={2.5} step={0.05}
                    precision={2}
                    sensitivity={8}
                    onChange={setLh}
                />

                {/* No "em" suffix — it doesn't fit beside a 4-char value in a
                    half-width cell, and the label already implies the unit. */}
                <ScrubField
                    label="Letter"
                    value={controls.ls}
                    min={-0.1} max={0.5} step={0.01}
                    precision={2}
                    sensitivity={8}
                    onChange={(v) => setControls({ ...controls, ls: v })}
                />
            </div>

            {axes.length > 0 && (
                <Disclosure
                    title="Variable axes"
                    count={axes.length}
                    onReset={() => setControls({ ...controls, axes: {} })}
                >
                    <div className="flex flex-col gap-2">
                        {axes.map(a => {
                            const step = axisStep(a);
                            return (
                                <div key={a.tag} className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                        <span className="font-medium text-foreground/80">{axisName(a.tag)}</span>
                                        <span className="font-mono">{a.tag} · {a.min}–{a.max}</span>
                                    </div>
                                    <ScrubField
                                        label={a.tag}
                                        value={controls.axes?.[a.tag] ?? a.def}
                                        min={a.min} max={a.max} step={step}
                                        precision={step < 1 ? (step < 0.1 ? 2 : 1) : 0}
                                        sensitivity={Math.max(0.5, 160 / ((a.max - a.min) / step))}
                                        onChange={(v) => setAxis(a.tag, v)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </Disclosure>
            )}

            <Disclosure
                title="OpenType features"
                count={changedFeatures || undefined}
                onReset={() => setControls({ ...controls, features: {} })}
            >
                <div className="flex flex-wrap gap-1.5">
                    {OT_FEATURES.map(f => {
                        const on = featureEnabled(controls.features, f.tag);
                        return (
                            <button
                                key={f.tag}
                                type="button"
                                onClick={() => toggleFeature(f.tag)}
                                aria-pressed={on}
                                title={`'${f.tag}'`}
                                className={cn(
                                    "text-[10.5px] px-2 py-1 rounded-full border font-medium transition-colors",
                                    on
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "text-muted-foreground border-border hover:text-foreground hover:border-foreground/40"
                                )}
                            >
                                {f.label}
                            </button>
                        );
                    })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 leading-snug">
                    Only features this font actually includes will change anything.
                </p>
            </Disclosure>
        </div>
    );
}
