import { useRef, useState, useCallback } from 'react';
import { cn } from "@/lib/utils";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * A Figma-style numeric field: drag the label sideways to scrub the value,
 * or click the number and type one.
 *
 * Replaces a Radix slider whose track was a 4px-tall hit target — technically
 * functional, but you had to land a click inside four pixels to use it.
 *
 * Pass `values` for a discrete set (font weights, which only exist at the
 * steps a family actually ships); scrubbing then walks that array by index
 * rather than moving through a continuous range.
 */
export default function ScrubField({
    label,
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    precision = 0,
    suffix = '',
    /** Pixels of horizontal travel per step. Lower = more sensitive. */
    sensitivity = 4,
    values,
    disabled = false,
}) {
    const [dragging, setDragging] = useState(false);
    const [draft, setDraft] = useState(null);
    const inputRef = useRef(null);
    const drag = useRef({ startX: 0, startValue: 0 });

    const discrete = Array.isArray(values) && values.length > 0;

    const commit = useCallback((next) => {
        if (discrete) {
            const i = clamp(Math.round(next), 0, values.length - 1);
            onChange(values[i]);
        } else {
            const snapped = Math.round(next / step) * step;
            // Floating-point steps (0.05, 0.01) accumulate error without this.
            onChange(Number(clamp(snapped, min, max).toFixed(precision + 2)));
        }
    }, [discrete, values, onChange, step, min, max, precision]);

    const onPointerDown = (e) => {
        if (disabled) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = {
            startX: e.clientX,
            startValue: discrete ? values.indexOf(value) : value,
        };
        setDragging(true);
    };

    const onPointerMove = (e) => {
        if (!dragging || disabled) return;
        const delta = e.clientX - drag.current.startX;
        const stepsMoved = delta / sensitivity;
        commit(discrete
            ? drag.current.startValue + stepsMoved
            : drag.current.startValue + stepsMoved * step);
    };

    const endDrag = (e) => {
        if (!dragging) return;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
        setDragging(false);
    };

    // Arrow keys work on the field as a whole, matching Figma.
    const onKeyDown = (e) => {
        if (disabled) return;
        const dir = e.key === 'ArrowUp' ? 1 : e.key === 'ArrowDown' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        const mult = e.shiftKey ? 10 : 1;
        commit(discrete
            ? values.indexOf(value) + dir * mult
            : value + dir * step * mult);
    };

    const display = draft !== null
        ? draft
        : (precision > 0 ? Number(value).toFixed(precision) : String(value));

    return (
        <div
            className={cn(
                "flex items-center gap-1 h-8 rounded-lg border bg-card px-1 transition-colors",
                disabled
                    ? "opacity-50"
                    : dragging
                        ? "border-primary ring-1 ring-primary/30"
                        : "border-border hover:border-foreground/25 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30"
            )}
        >
            <span
                role="slider"
                tabIndex={disabled ? -1 : 0}
                aria-label={label}
                aria-valuenow={value}
                aria-valuemin={discrete ? values[0] : min}
                aria-valuemax={discrete ? values[values.length - 1] : max}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onKeyDown={onKeyDown}
                title={`Drag to change ${label.toLowerCase()}`}
                className={cn(
                    "select-none touch-none text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
                    "px-1.5 rounded outline-none focus-visible:ring-1 focus-visible:ring-primary",
                    disabled ? "cursor-not-allowed" : "cursor-ew-resize hover:text-foreground"
                )}
            >
                {label}
            </span>

            <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                disabled={disabled}
                value={display}
                aria-label={`${label} value`}
                onChange={(e) => setDraft(e.target.value)}
                onFocus={(e) => e.target.select()}
                onBlur={() => {
                    if (draft !== null) {
                        const parsed = parseFloat(draft);
                        if (!Number.isNaN(parsed)) {
                            // Typed weights are real values, not indices.
                            if (discrete) {
                                const nearest = values.reduce((best, w) =>
                                    Math.abs(w - parsed) < Math.abs(best - parsed) ? w : best);
                                onChange(nearest);
                            } else {
                                onChange(Number(clamp(parsed, min, max).toFixed(precision + 2)));
                            }
                        }
                        setDraft(null);
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.currentTarget.blur(); return; }
                    if (e.key === 'Escape') { setDraft(null); e.currentTarget.blur(); return; }
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') onKeyDown(e);
                }}
                className="w-full min-w-0 bg-transparent outline-none text-[12px] text-foreground tabular-nums"
            />

            {suffix && (
                <span className="shrink-0 pr-1 text-[10px] text-muted-foreground/70">{suffix}</span>
            )}
        </div>
    );
}
