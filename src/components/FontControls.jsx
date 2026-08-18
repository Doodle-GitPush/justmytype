import { useEffect, useMemo } from 'react';
import { Slider } from "@/components/ui/slider";
import { FONT_METADATA } from '../data/fonts';

function Control({ label, display, suffix = '', value, onValueChange, ...slider }) {
    return (
        <>
            <div className="flex justify-between items-center mt-6 mb-3 first:mt-0">
                <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
                <span className="text-[13px] text-muted-foreground tabular-nums">{display}{suffix}</span>
            </div>
            <Slider aria-label={label} value={[value]} onValueChange={onValueChange} {...slider} />
        </>
    );
}

/**
 * Size / Weight / Line height / Letter spacing sliders for one font.
 * `lhValue`/`setLh` are separate from `controls`/`setControls` rather than
 * reading `controls.lh` directly: the secondary font's rendered line-height
 * is actually driven by the app-wide bodyLineHeight, not its own controls.lh
 * (which exists in state but is silently overridden everywhere it paints),
 * so the caller has to say explicitly which value/setter is the real one.
 */
export default function FontControls({ font, controls, setControls, lhValue, setLh }) {
    const meta = useMemo(() => FONT_METADATA.find(m => m.family === font), [font]);

    // Only offer weights the family actually ships.
    const weights = meta?.weights?.length ? meta.weights : [400];
    const weightIndex = Math.max(0, weights.indexOf(controls.weight));

    // Keep the selected weight valid when the font changes.
    useEffect(() => {
        if (!weights.includes(controls.weight)) {
            const nearest = weights.reduce((best, w) =>
                Math.abs(w - controls.weight) < Math.abs(best - controls.weight) ? w : best
            );
            setControls({ ...controls, weight: nearest });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [font]);

    return (
        <div className="flex flex-col">
            <Control
                label="Size" display={controls.size} suffix="px"
                min={12} max={120} step={1}
                value={controls.size}
                onValueChange={(val) => setControls({ ...controls, size: val[0] })}
            />

            <div className="flex justify-between items-center mt-6 mb-3">
                <span className="text-[13px] font-medium text-muted-foreground">Weight</span>
                <span className="text-[13px] text-muted-foreground tabular-nums">
                    {controls.weight}
                    {weights.length === 1 && <span className="ml-1 opacity-60">(only)</span>}
                </span>
            </div>
            <Slider
                aria-label="Weight"
                min={0} max={Math.max(0, weights.length - 1)} step={1}
                value={[weightIndex]}
                disabled={weights.length === 1}
                onValueChange={(val) => setControls({ ...controls, weight: weights[val[0]] })}
            />

            <Control
                label="Line Height" display={lhValue}
                min={0.8} max={2.5} step={0.05}
                value={lhValue}
                onValueChange={(val) => setLh(val[0])}
            />

            <Control
                label="Letter Spacing" display={controls.ls} suffix=" em"
                min={-0.1} max={0.5} step={0.01}
                value={controls.ls}
                onValueChange={(val) => setControls({ ...controls, ls: val[0] })}
            />
        </div>
    );
}
