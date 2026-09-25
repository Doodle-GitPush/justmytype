import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { gsap, useGSAP, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';
import { TABS } from '../data/constants';
import { cn } from '@/lib/utils';

const PILL_H = 52;   // matches the dock's text bar and Studio button
const ROW_H = 36;
const PAD = 6;
const PANEL_W = 196;
const MAX_CORNER = 40;
// Slight overshoot on open so the shape lands like something liquid
// settling, not a box snapping to size; closing is a plain ease-in.
const OPEN_EASE = 'cubic-bezier(0.3, 1.3, 0.4, 1)';
const CLOSE_EASE = 'cubic-bezier(0.5, 0, 0.3, 1)';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Preview-mode switcher, bottom-left beside the dock.
 *
 * At rest it's a pill naming the current view. Pressed, the pill itself
 * grows up into a rounded panel listing every view — the same surface
 * morphing, not a menu popping out of a button — with a highlight that
 * glides between rows as you hover or arrow through them. Picking one
 * (or clicking away, or Esc) folds it back into the pill.
 *
 * `corner` sets the open panel's radius (0–40px); the closed pill stays
 * fully round at its own height.
 */
export default function ViewMenu({ activeTab, setActiveTab, corner = 28 }) {
    const rootRef = useRef(null);
    const labelRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [pressed, setPressed] = useState(false);
    const [hover, setHover] = useState(() => Math.max(0, TABS.findIndex(t => t.id === activeTab)));
    const [pillW, setPillW] = useState(140);
    const hoverRef = useRef(hover);
    useEffect(() => { hoverRef.current = hover; }, [hover]);

    const active = TABS.find(t => t.id === activeTab) ?? TABS[0];
    const ActiveIcon = active.icon;
    const radius = clamp(corner, 0, MAX_CORNER);
    const panelH = PAD * 2 + TABS.length * ROW_H;
    const reduced = prefersReducedMotion();

    // The closed pill hugs its label, so measure it (after the UI font lands).
    useLayoutEffect(() => {
        const el = labelRef.current;
        if (!el) return;
        let alive = true;
        const measure = () => { if (alive) setPillW(12 + 28 + 8 + el.offsetWidth + 34); };
        measure();
        document.fonts?.ready.then(measure).catch(() => {});
        return () => { alive = false; };
    }, [activeTab]);

    // Click-away and Esc fold it back up.
    useEffect(() => {
        if (!open) return;
        const onDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); }
            else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                setHover(h => (h + (e.key === 'ArrowDown' ? 1 : -1) + TABS.length) % TABS.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                setActiveTab(TABS[hoverRef.current].id);
                setOpen(false);
            }
        };
        document.addEventListener('pointerdown', onDown);
        document.addEventListener('keydown', onKey, true);
        return () => {
            document.removeEventListener('pointerdown', onDown);
            document.removeEventListener('keydown', onKey, true);
        };
    }, [open, setActiveTab]);

    // Entrance, same beat as the rest of the chrome.
    useGSAP(() => {
        if (reduced) return;
        gsap.from(rootRef.current, { opacity: 0, y: 24, duration: DUR.slow, ease: EASE.out, delay: 0.2 });
    }, { scope: rootRef });

    const press = () => {
        if (open) { setOpen(false); return; }
        // A short squash before it grows — the "press" of a soft object.
        setPressed(true);
        setHover(Math.max(0, TABS.findIndex(t => t.id === activeTab)));
        setTimeout(() => { setPressed(false); setOpen(true); }, reduced ? 0 : 70);
    };

    const choose = (id) => {
        setActiveTab(id);
        setOpen(false);
    };

    const ease = open ? OPEN_EASE : CLOSE_EASE;
    const dur = reduced ? 0 : open ? 520 : 320;

    return (
        <nav
            ref={rootRef}
            aria-label="Preview mode"
            /* Anchored to the dock's left edge (the bar is a fixed 640px on
               lg+, so half of that plus a 12px gutter), growing up and to
               the left, away from the bar. */
            className="hidden lg:block fixed right-[calc(50%+332px)] bottom-6 z-40"
            style={{ width: open ? PANEL_W : pillW, height: PILL_H }}
        >
            {/* The one surface that morphs between pill and panel. */}
            <div
                aria-hidden="true"
                className="absolute right-0 bottom-0 bg-background/90 backdrop-blur-xl border border-border shadow-lg"
                style={{
                    width: open ? PANEL_W : pillW,
                    height: open ? panelH : PILL_H,
                    borderRadius: open ? radius : PILL_H / 2,
                    transform: pressed ? 'scale(0.96)' : 'scale(1)',
                    transformOrigin: '100% 100%',
                    transition: `width ${dur}ms ${ease}, height ${dur}ms ${ease}, border-radius ${dur}ms ${ease}, transform 120ms ease-out, box-shadow 300ms ease`,
                    boxShadow: open ? '0 18px 50px -12px rgb(0 0 0 / 0.25)' : undefined,
                }}
            />

            {/* Closed: the pill's own face. */}
            <button
                type="button"
                onClick={press}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label={`Preview mode: ${active.label}. Change view`}
                className={cn(
                    "absolute right-0 bottom-0 flex items-center gap-2 pl-3 pr-3 rounded-full text-primary transition-opacity",
                    open ? "opacity-0 pointer-events-none duration-100" : "opacity-100 duration-300 delay-100"
                )}
                style={{ height: PILL_H, width: pillW }}
            >
                <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ActiveIcon size={15} />
                </span>
                <span ref={labelRef} className="text-[13px] font-semibold whitespace-nowrap">{active.label}</span>
                <ChevronUp size={14} className="ml-auto text-muted-foreground shrink-0" />
            </button>

            {/* Open: the list, laid over the grown surface. */}
            <div
                role="menu"
                aria-label="Preview mode"
                className={cn("absolute right-0 bottom-0", !open && "pointer-events-none")}
                style={{ width: PANEL_W, height: panelH, padding: PAD }}
                onPointerLeave={() => setHover(Math.max(0, TABS.findIndex(t => t.id === activeTab)))}
            >
                {/* The highlight that glides between rows. */}
                <span
                    aria-hidden="true"
                    className="absolute left-[6px] right-[6px] bg-muted"
                    style={{
                        top: PAD,
                        height: ROW_H,
                        borderRadius: clamp(radius - PAD, 0, ROW_H / 2),
                        transform: `translateY(${hover * ROW_H}px)`,
                        opacity: open ? 1 : 0,
                        transition: reduced ? 'none' : 'transform 260ms cubic-bezier(0.3, 1.2, 0.4, 1), opacity 200ms ease',
                    }}
                />
                {TABS.map((tab, i) => {
                    const Icon = tab.icon;
                    const isActive = tab.id === activeTab;
                    // Rows arrive bottom-up — nearest the pill first — and
                    // all leave together on close.
                    const delay = open && !reduced ? 60 + (TABS.length - 1 - i) * 24 : 0;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="menuitemradio"
                            aria-checked={isActive}
                            tabIndex={open ? 0 : -1}
                            onPointerEnter={() => setHover(i)}
                            onFocus={() => setHover(i)}
                            onClick={() => choose(tab.id)}
                            className={cn(
                                "relative w-full flex items-center gap-2.5 px-2.5 text-[13px] whitespace-nowrap outline-none",
                                isActive ? "text-primary font-semibold" : "text-foreground/80"
                            )}
                            style={{
                                height: ROW_H,
                                opacity: open ? 1 : 0,
                                transform: open ? 'translateY(0)' : 'translateY(6px)',
                                transition: reduced ? 'none' : `opacity 220ms ease ${delay}ms, transform 320ms cubic-bezier(0.3, 1.2, 0.4, 1) ${delay}ms`,
                            }}
                        >
                            <Icon size={16} className="shrink-0" />
                            <span className="flex-1 text-left">{tab.label}</span>
                            <kbd className="text-[10px] font-mono text-muted-foreground/70">{i + 1}</kbd>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
