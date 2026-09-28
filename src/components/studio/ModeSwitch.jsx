import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const MODES = [
  { id: 'create', label: 'Create' },
  { id: 'play', label: 'Play' },
];

/**
 * Create · Play — the two sides of the Studio home.
 *
 * The active marker is one element that slides between labels,
 * measured from the buttons, so it lands exactly on each word
 * whatever the UI font's widths.
 */
export default function ModeSwitch({ value, onChange, className }) {
    const refs = useRef({});
    const [marker, setMarker] = useState(null);

    useLayoutEffect(() => {
        const measure = () => {
            const el = refs.current[value];
            if (el) setMarker({ left: el.offsetLeft, width: el.offsetWidth });
        };
        measure();
        document.fonts?.ready.then(measure).catch(() => {});
    }, [value]);

    return (
        <div
            role="tablist"
            aria-label="Mode"
            className={cn('relative flex items-center p-1 rounded-full bg-background/80 backdrop-blur border border-border shadow-sm', className)}
        >
            {marker && (
                <span
                    aria-hidden="true"
                    className="absolute top-1 bottom-1 rounded-full bg-foreground transition-[left,width] duration-300 ease-[cubic-bezier(0.3,1.2,0.4,1)]"
                    style={{ left: marker.left, width: marker.width }}
                />
            )}
            {MODES.map((m) => (
                <button
                    key={m.id}
                    ref={(el) => { refs.current[m.id] = el; }}
                    role="tab"
                    aria-selected={value === m.id}
                    onClick={() => onChange(m.id)}
                    className={cn(
                        'relative z-10 h-8 px-4 rounded-full text-[13px] font-semibold transition-colors',
                        value === m.id ? 'text-background' : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    {m.label}
                </button>
            ))}
        </div>
    );
}
