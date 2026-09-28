import { useEffect, useRef } from 'react';
import { stack } from '../../lib/typeStyles';
import { drawLab, labDefaults, LAB_W } from '../../lib/letterLab';

/**
 * Tiny live previews for the Studio home cards — each one a taste of
 * what its mode does, made from the user's current pair, so the card
 * reads as "this, with your fonts" rather than as a menu item.
 *
 * All CSS animation (keyframes in index.css), apart from Letter Lab,
 * which draws one still frame with the real generator. Everything
 * holds still under prefers-reduced-motion.
 */

const firstWords = (text, n) => text.split(/\s+/).slice(0, n).join(' ') || 'Type';

/** Animate — the headline's first words rolling in a wave. */
export function AnimatePreview({ font, weight, text }) {
    const word = firstWords(text, 2);
    return (
        <div className="h-full flex items-center justify-center text-foreground" style={{ fontFamily: stack(font), fontWeight: weight }}>
            <span className="text-[34px] leading-none whitespace-nowrap" aria-hidden="true">
                {Array.from(word).map((ch, i) => (
                    <span
                        key={i}
                        className="inline-block motion-safe:animate-[jmt-wave_1.6s_ease-in-out_infinite]"
                        style={{ animationDelay: `${i * 70}ms` }}
                    >
                        {ch === ' ' ? ' ' : ch}
                    </span>
                ))}
            </span>
        </div>
    );
}

/** Poster — a little poster set in the pair, slowly breathing. */
export function PosterPreview({ font, secondary, weight, text }) {
    return (
        <div className="h-full flex items-center justify-center">
            <div
                className="w-[92px] h-[116px] rounded-[3px] bg-[#1b1a17] text-[#f4efe6] p-2.5 flex flex-col justify-between shadow-lg motion-safe:animate-[jmt-sway_5s_ease-in-out_infinite]"
                aria-hidden="true"
            >
                <span className="text-[6px] tracking-[0.25em] uppercase opacity-70" style={{ fontFamily: stack(secondary) }}>Vol. 01</span>
                <span className="text-[19px] leading-[0.95] break-words" style={{ fontFamily: stack(font), fontWeight: weight }}>
                    {firstWords(text, 3)}
                </span>
                <span className="text-[6px] text-[#ff7a45]" style={{ fontFamily: stack(secondary) }}>JustMyType</span>
            </div>
        </div>
    );
}

/** Letter Lab — one real frame of the radial generator, in the pair's face. */
export function LabPreview({ font, weight }) {
    const ref = useRef(null);
    useEffect(() => {
        let alive = true;
        const draw = () => {
            const canvas = ref.current;
            if (!alive || !canvas) return;
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            const ctx = canvas.getContext('2d');
            const k = canvas.width / LAB_W;
            ctx.setTransform(k, 0, 0, k, 0, 0);
            drawLab(ctx, {
                mode: 'radial',
                p: { ...labDefaults('radial'), rings: 5, scale: 0.9 },
                glyphs: 'Aa&g',
                word: '',
                font: stack(font),
                weight,
                seed: 7,
                colors: { bg: '#f4efe6', ink: '#1b1a17', ink2: '#c2410c' },
                H: Math.round((LAB_W * h) / w),
            });
        };
        draw();
        document.fonts?.load(`${weight} 40px ${stack(font)}`, 'Aa&g').then(draw).catch(() => {});
        return () => { alive = false; };
    }, [font, weight]);
    return <canvas ref={ref} className="w-full h-full rounded-xl" aria-hidden="true" />;
}

/** Kern — a word whose inner gaps keep drifting and settling. */
export function KernPreview({ font }) {
    const word = 'KERN';
    return (
        <div className="h-full flex items-center justify-center text-foreground" style={{ fontFamily: stack(font), fontWeight: 700 }}>
            <span className="text-[40px] leading-none flex" aria-hidden="true">
                {Array.from(word).map((ch, i) => (
                    <span
                        key={i}
                        className={i > 0 && i < word.length - 1 ? 'inline-block motion-safe:animate-[jmt-kern_2.4s_ease-in-out_infinite]' : 'inline-block'}
                        style={{ animationDelay: `${i * 300}ms` }}
                    >
                        {ch}
                    </span>
                ))}
            </span>
        </div>
    );
}

/** Type Match — a small stack of cards, the top one swaying toward a swipe. */
export function MatchPreview({ font, secondary, weight }) {
    const card = 'absolute inset-0 rounded-xl border border-border bg-card shadow-md p-2.5 flex flex-col gap-1';
    return (
        <div className="h-full flex items-center justify-center" aria-hidden="true">
            <div className="relative w-[84px] h-[104px]">
                <div className={`${card} rotate-[-6deg] opacity-60`} />
                <div className={`${card} rotate-[4deg] opacity-80`} />
                <div className={`${card} motion-safe:animate-[jmt-swipe_3.2s_ease-in-out_infinite]`}>
                    <span className="text-[22px] leading-none text-foreground" style={{ fontFamily: stack(font), fontWeight: weight }}>Aa</span>
                    <span className="h-1 w-10 rounded bg-muted" />
                    <span className="h-1 w-12 rounded bg-muted" />
                    <span className="mt-auto text-[7px] text-muted-foreground truncate" style={{ fontFamily: stack(secondary) }}>{font}</span>
                </div>
            </div>
        </div>
    );
}
