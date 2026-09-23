import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { FONT_METADATA } from '../data/fonts';
import { axesFor, axisName, weightRangeFor, OT_FEATURES, featureEnabled } from '../lib/typeStyles';
import { track } from '../lib/achievements';
import ScrubField from './ScrubField';
import { cn } from "@/lib/utils";

// How the OpenType toggles are grouped in the panel.
const FEATURE_GROUPS = [
    { title: 'Ligatures & kerning', tags: ['kern', 'liga', 'calt', 'dlig'] },
    { title: 'Letterforms', tags: ['swsh', 'salt', 'smcp', 'c2sc', 'case'] },
    { title: 'Numbers', tags: ['onum', 'lnum', 'tnum', 'frac', 'zero'] },
];
const SETS = ['ss01', 'ss02', 'ss03', 'ss04', 'ss05'];
const FEATURE_BY_TAG = Object.fromEntries(OT_FEATURES.map(f => [f.tag, f]));

function Tabs({ tabs, value, onChange }) {
    return (
        <div role="tablist" className="flex p-0.5 bg-muted rounded-lg gap-0.5">
            {tabs.map(t => (
                <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={value === t.id}
                    onClick={() => onChange(t.id)}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all",
                        value === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {t.label}
                    {t.badge ? <span className="min-w-[14px] h-[14px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] leading-[14px] tabular-nums">{t.badge}</span> : null}
                </button>
            ))}
        </div>
    );
}

function Toggle({ on, onClick, children, title, className }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={on}
            title={title}
            className={cn(
                "text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors",
                on
                    ? "bg-primary/10 text-primary border-primary/40"
                    : "text-muted-foreground border-border hover:text-foreground hover:border-foreground/30",
                className
            )}
        >
            {children}
        </button>
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

    const [tab, setTab] = useState('basics');
    const changedAxes = axes.filter(a => controls.axes?.[a.tag] !== undefined && controls.axes[a.tag] !== a.def).length;
    const tabs = [
        { id: 'basics', label: 'Basics' },
        ...(axes.length ? [{ id: 'axes', label: 'Axes', badge: changedAxes }] : []),
        { id: 'features', label: 'OpenType', badge: changedFeatures },
    ];
    // A font without axes can't stay on the Axes tab.
    const current = tabs.some(t => t.id === tab) ? tab : 'basics';

    return (
        <div className="flex flex-col gap-3">
            <Tabs tabs={tabs} value={current} onChange={setTab} />

            {current === 'basics' && (
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
            )}

            {current === 'axes' && (
                <div className="flex flex-col gap-3">
                    {axes.map(a => {
                        const step = axisStep(a);
                        const value = controls.axes?.[a.tag] ?? a.def;
                        const precision = step < 1 ? (step < 0.1 ? 2 : 1) : 0;
                        return (
                            <label key={a.tag} className="flex flex-col gap-1">
                                <span className="flex items-baseline justify-between gap-2 text-[11px]">
                                    <span className="font-medium text-foreground truncate">
                                        {axisName(a.tag)} <span className="font-mono text-[10px] text-muted-foreground">{a.tag}</span>
                                    </span>
                                    <span className="font-mono tabular-nums text-foreground">{Number(value).toFixed(precision)}</span>
                                </span>
                                <input
                                    type="range"
                                    min={a.min} max={a.max} step={step}
                                    value={value}
                                    onChange={(e) => setAxis(a.tag, Number(e.target.value))}
                                    onDoubleClick={() => setAxis(a.tag, a.def)}
                                    aria-label={axisName(a.tag)}
                                    className="w-full h-1.5 accent-[hsl(var(--primary))] cursor-pointer"
                                />
                            </label>
                        );
                    })}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Double-click a slider to reset it.</span>
                        {changedAxes > 0 && (
                            <button type="button" onClick={() => setControls({ ...controls, axes: {} })} className="flex items-center gap-1 hover:text-foreground">
                                <RotateCcw size={10} /> Reset all
                            </button>
                        )}
                    </div>
                </div>
            )}

            {current === 'features' && (
                <div className="flex flex-col gap-3">
                    {FEATURE_GROUPS.map(g => (
                        <div key={g.title} className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-medium text-muted-foreground">{g.title}</span>
                            <div className="flex flex-wrap gap-1">
                                {g.tags.map(tag => (
                                    <Toggle key={tag} on={featureEnabled(controls.features, tag)} onClick={() => toggleFeature(tag)} title={`'${tag}'`}>
                                        {FEATURE_BY_TAG[tag].label}
                                    </Toggle>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-medium text-muted-foreground">Stylistic sets</span>
                        <div className="grid grid-cols-5 gap-1">
                            {SETS.map((tag, i) => (
                                <Toggle key={tag} on={featureEnabled(controls.features, tag)} onClick={() => toggleFeature(tag)} title={`'${tag}'`} className="px-0 text-center tabular-nums">
                                    {i + 1}
                                </Toggle>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground leading-snug">
                        <span>Only features this font includes change anything.</span>
                        {changedFeatures > 0 && (
                            <button type="button" onClick={() => setControls({ ...controls, features: {} })} className="shrink-0 flex items-center gap-1 hover:text-foreground">
                                <RotateCcw size={10} /> Reset
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
