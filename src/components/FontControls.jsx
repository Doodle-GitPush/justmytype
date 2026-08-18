import { useEffect, useMemo } from 'react';
import { FONT_METADATA } from '../data/fonts';
import ScrubField from './ScrubField';

/**
 * Size / Weight / Line height / Letter spacing for one font, as Figma-style
 * scrub fields — drag the label to change, or click the number and type.
 *
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
        <div className="grid grid-cols-2 gap-2">
            <ScrubField
                label="Size"
                suffix="px"
                value={controls.size}
                min={12} max={200} step={1}
                sensitivity={3}
                onChange={(v) => setControls({ ...controls, size: v })}
            />

            <ScrubField
                label="Weight"
                values={weights}
                value={controls.weight}
                sensitivity={10}
                disabled={weights.length === 1}
                onChange={(v) => setControls({ ...controls, weight: v })}
            />

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
    );
}
