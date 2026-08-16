import { useEffect, useMemo, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { FONT_METADATA } from '../data/fonts';
import { loadFont } from '../lib/fontLoader';
import { stack } from '../lib/typeStyles';
import { gsap, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';
import Presence from './motion/Presence';

const WEIGHT_LABELS = {
    100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium',
    600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black',
};

const PREVIEW_SIZES = [
    { label: 'Display', size: 48 },
    { label: 'Heading', size: 32 },
    { label: 'Body', size: 16 },
    { label: 'Caption', size: 12 },
];

export default function FontInfoPanel({ font, onClose }) {
    const bodyRef = useRef(null);
    const closeRef = useRef(null);
    const meta = useMemo(() => FONT_METADATA.find(m => m.family === font) || null, [font]);

    useEffect(() => {
        if (font) loadFont(font);
    }, [font]);

    // Move focus into the dialog so keyboard users land somewhere sensible,
    // and restore it on close.
    useEffect(() => {
        if (!font) return;
        const previous = document.activeElement;
        closeRef.current?.focus();
        return () => previous?.focus?.();
    }, [font]);

    // Stagger the sections in once the panel itself has arrived.
    useEffect(() => {
        if (!font || !bodyRef.current || prefersReducedMotion()) return;
        const rows = bodyRef.current.querySelectorAll('[data-info-row]');
        const tween = gsap.from(rows, {
            opacity: 0, y: 16, duration: DUR.base, ease: EASE.out, stagger: 0.06, delay: 0.12,
        });
        return () => tween.kill();
    }, [font]);

    const googleFontsUrl = font ? `https://fonts.google.com/specimen/${font.replace(/\s+/g, '+')}` : '#';
    const fontStack = font ? stack(font) : undefined;

    return (
        <>
            <Presence
                show={!!font}
                from={{ opacity: 0 }}
                to={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                duration={DUR.fast}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                onClick={onClose}
            />

            <Presence
                show={!!font}
                from={{ opacity: 0, y: 40, scale: 0.97 }}
                to={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.98 }}
                duration={DUR.base}
                role="dialog"
                aria-modal="true"
                aria-label={font ? `${font} font details` : 'Font details'}
                className="fixed bottom-0 left-0 right-0 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-[70] lg:w-[600px] w-full max-h-[90dvh] lg:max-h-[80vh] bg-background border border-border lg:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-4 border-b border-border shrink-0">
                    <div className="flex flex-col gap-1 min-w-0">
                        <div className="text-3xl font-bold text-foreground leading-tight truncate pr-4" style={{ fontFamily: fontStack }}>
                            {font}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                            {meta?.category && (
                                <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                    {meta.category}
                                </span>
                            )}
                            {meta?.hasItalic && (
                                <span className="text-[11px] font-semibold italic px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                                    Italic
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        ref={closeRef}
                        onClick={onClose}
                        aria-label="Close font details"
                        className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div ref={bodyRef} className="overflow-y-auto flex-1 scrollbar-hide">
                    <div data-info-row className="p-6 border-b border-border">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 block">Type Scale</span>
                        <div className="flex flex-col gap-4">
                            {PREVIEW_SIZES.map(({ label, size }) => (
                                <div key={label} className="flex items-baseline gap-4">
                                    <span className="text-[10px] text-muted-foreground w-14 shrink-0 pt-1">{label}</span>
                                    <div
                                        className="text-foreground leading-tight overflow-hidden text-ellipsis whitespace-nowrap flex-1"
                                        style={{ fontFamily: fontStack, fontSize: size }}
                                    >
                                        The quick brown fox
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums">{size}px</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div data-info-row className="p-6 border-b border-border">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Glyphs</span>
                        <div className="text-[22px] text-foreground leading-[1.5] tracking-wide break-words" style={{ fontFamily: fontStack }}>
                            Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
                        </div>
                        <div className="text-[18px] text-foreground/70 tracking-[0.15em] mt-3" style={{ fontFamily: fontStack }}>
                            0 1 2 3 4 5 6 7 8 9
                        </div>
                    </div>

                    {meta?.weights?.length > 0 && (
                        <div data-info-row className="p-6 border-b border-border">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 block">
                                {meta.weights.length} Weight{meta.weights.length !== 1 ? 's' : ''}
                            </span>
                            <div className="flex flex-col gap-2">
                                {meta.weights.map(w => (
                                    <div key={w} className="flex items-center gap-4">
                                        <span className="text-[10px] text-muted-foreground w-8 shrink-0 tabular-nums">{w}</span>
                                        <span className="text-[20px] text-foreground truncate" style={{ fontFamily: fontStack, fontWeight: w }}>
                                            Typography
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/60 ml-auto shrink-0">
                                            {WEIGHT_LABELS[w] || 'Custom'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border shrink-0 flex items-center justify-between gap-3 bg-card/50">
                    <div className="text-[12px] text-muted-foreground">
                        {meta ? `${meta.weights?.length ?? '?'} weights · ${meta.hasItalic ? 'Italic ✓' : 'No italic'}` : 'Local / custom font'}
                    </div>
                    <a
                        href={googleFontsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-[13px] font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                        View on Google Fonts
                        <ExternalLink size={13} />
                    </a>
                </div>
            </Presence>
        </>
    );
}
