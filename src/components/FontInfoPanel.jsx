import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Check } from 'lucide-react';
import { FONT_METADATA } from '../data/fonts';
import { useEffect, useMemo } from 'react';

const loadedFonts = new Set();
const loadFont = (fontName) => {
    if (!fontName || loadedFonts.has(fontName)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap`;
    document.head.appendChild(link);
    loadedFonts.add(fontName);
};

const WEIGHT_LABELS = {
    100: 'Thin',
    200: 'ExtraLight',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'SemiBold',
    700: 'Bold',
    800: 'ExtraBold',
    900: 'Black',
};

const PREVIEW_SIZES = [
    { label: 'Display', size: 48 },
    { label: 'Heading', size: 32 },
    { label: 'Body', size: 16 },
    { label: 'Caption', size: 12 },
];

export default function FontInfoPanel({ font, onClose }) {
    const meta = useMemo(() =>
        FONT_METADATA.find(m => m.family === font) || null,
        [font]
    );

    useEffect(() => {
        if (font) loadFont(font);
    }, [font]);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const googleFontsUrl = font
        ? `https://fonts.google.com/specimen/${font.replace(/\s+/g, '+')}`
        : '#';

    return (
        <AnimatePresence>
            {font && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        key="panel"
                        initial={{ opacity: 0, y: 40, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="fixed bottom-0 left-0 right-0 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-[70] lg:w-[600px] w-full max-h-[90dvh] lg:max-h-[80vh] bg-background border border-border lg:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 pb-4 border-b border-border shrink-0">
                            <div className="flex flex-col gap-1 min-w-0">
                                <div
                                    className="text-3xl font-bold text-foreground leading-tight truncate pr-4"
                                    style={{ fontFamily: `'${font}', sans-serif` }}
                                >
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
                                    {meta?.designer && (
                                        <span className="text-[12px] text-muted-foreground">
                                            by <span className="text-foreground font-medium">{meta.designer}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="overflow-y-auto flex-1 scrollbar-hide">

                            {/* Live Scale Preview */}
                            <div className="p-6 border-b border-border">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 block">Type Scale Preview</span>
                                <div className="flex flex-col gap-4">
                                    {PREVIEW_SIZES.map(({ label, size }) => (
                                        <div key={label} className="flex items-baseline gap-4">
                                            <span className="text-[10px] text-muted-foreground w-14 shrink-0 pt-1">{label}</span>
                                            <div
                                                className="text-foreground leading-tight overflow-hidden text-ellipsis whitespace-nowrap flex-1"
                                                style={{ fontFamily: `'${font}', sans-serif`, fontSize: size }}
                                            >
                                                The quick brown fox
                                            </div>
                                            <span className="text-[10px] text-muted-foreground/60 shrink-0">{size}px</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Alphabet Specimen */}
                            <div className="p-6 border-b border-border">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Glyphs</span>
                                <div
                                    className="text-[22px] text-foreground leading-[1.5] tracking-wide break-words"
                                    style={{ fontFamily: `'${font}', sans-serif` }}
                                >
                                    Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
                                </div>
                                <div
                                    className="text-[18px] text-foreground/70 tracking-[0.15em] mt-3"
                                    style={{ fontFamily: `'${font}', sans-serif` }}
                                >
                                    0 1 2 3 4 5 6 7 8 9
                                </div>
                            </div>

                            {/* Available Weights */}
                            {meta?.weights?.length > 0 && (
                                <div className="p-6 border-b border-border">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
                                        {meta.weights.length} Weight{meta.weights.length !== 1 ? 's' : ''} Available
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {meta.weights.map(w => (
                                            <div
                                                key={w}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-[12px] text-foreground"
                                                style={{ fontFamily: `'${font}', sans-serif`, fontWeight: w }}
                                            >
                                                <span className="text-muted-foreground text-[10px] w-8 shrink-0">{w}</span>
                                                <span>{WEIGHT_LABELS[w] || 'Custom'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Weight Ramp — visual "the" at each weight */}
                            {meta?.weights?.length > 0 && (
                                <div className="p-6 border-b border-border">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 block">Weight Ramp</span>
                                    <div className="flex flex-col gap-2">
                                        {meta.weights.map(w => (
                                            <div key={w} className="flex items-center gap-4">
                                                <span className="text-[10px] text-muted-foreground w-8 shrink-0">{w}</span>
                                                <span
                                                    className="text-[20px] text-foreground"
                                                    style={{ fontFamily: `'${font}', sans-serif`, fontWeight: w }}
                                                >
                                                    Typography
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-border shrink-0 flex items-center justify-between gap-3 bg-card/50">
                            <div className="text-[12px] text-muted-foreground">
                                {meta
                                    ? `${meta.weights?.length ?? '?'} weights · ${meta.hasItalic ? 'Italic ✓' : 'No italic'}`
                                    : 'Local / custom font'
                                }
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
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
