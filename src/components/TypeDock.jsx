import { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { SlidersHorizontal, X, Filter, XCircle, Lock, Unlock, RefreshCw, Upload } from 'lucide-react';
import FontSection from './FontSection';
import FontControls from './FontControls';
import { stack } from '../lib/typeStyles';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FONT_METADATA, loadCustomFont } from '../data/fonts';
import { gsap, useGSAP, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';
import { cn } from "@/lib/utils";

const CATEGORIES = ['Sans Serif', 'Serif', 'Display', 'Handwriting', 'Monospace'];
const WEIGHT_GROUPS = [
    { label: 'Light', min: 100, max: 300 },
    { label: 'Regular', min: 400, max: 500 },
    { label: 'Bold', min: 600, max: 900 }
];

function Pill({ active, onClick, children, className }) {
    return (
        <button
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                "text-[11px] px-3 py-1.5 rounded-full border font-medium transition-all duration-200 active:scale-95",
                active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground",
                className
            )}
        >
            {children}
        </button>
    );
}

/**
 * Compact primary/secondary chip — lock toggle plus the font name, which
 * opens its size/weight/line-height/letter-spacing fields. Used to live as
 * a full-width card at the top of the old left sidebar; moved here so the
 * pairing stays visible right where you're typing instead of off in a rail
 * that didn't exist on mobile at all. Font details moved to the top-right
 * toolbar, keeping this chip down to the two things you touch constantly.
 */
function FontPill({ font, isLocked, onToggleLock, controls, setControls, lhValue, setLh }) {
    const nameRef = useRef(null);
    const prevFont = useRef(font);
    const [adjustOpen, setAdjustOpen] = useState(false);

    useLayoutEffect(() => {
        if (font === prevFont.current) return;
        prevFont.current = font;
        if (!nameRef.current || prefersReducedMotion()) return;
        gsap.fromTo(
            nameRef.current,
            { opacity: 0, y: 6 },
            { opacity: 1, y: 0, duration: DUR.base, ease: EASE.out, overwrite: 'auto' }
        );
    }, [font]);

    return (
        <div
            className={cn(
                "flex items-center h-10 rounded-full border shadow-sm transition-all duration-200 overflow-hidden shrink-0",
                isLocked
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background/90 backdrop-blur border-border text-foreground hover:border-foreground/30"
            )}
        >
            <button
                onClick={onToggleLock}
                aria-pressed={isLocked}
                aria-label={`${isLocked ? 'Unlock' : 'Lock'} ${font}`}
                title={isLocked ? "Locked — won't change on Generate Pair" : 'Click to lock'}
                className={cn(
                    "shrink-0 w-8 h-full flex items-center justify-center border-r transition-colors",
                    isLocked
                        ? "border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                        : "border-border/60 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
                )}
            >
                {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
            </button>

            <Popover open={adjustOpen} onOpenChange={setAdjustOpen}>
                <PopoverTrigger asChild>
                    <button
                        aria-label={`Adjust ${font} — size, weight, line height, letter spacing`}
                        aria-expanded={adjustOpen}
                        className="flex items-center px-3 h-full min-w-0"
                    >
                        <span
                            ref={nameRef}
                            className="text-[12.5px] font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] sm:max-w-[150px] tracking-tight"
                            style={{ fontFamily: stack(font) }}
                        >
                            {font}
                        </span>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[248px] p-3" align="center" side="top" sideOffset={10}>
                    <div
                        className="text-[13px] font-semibold text-foreground mb-3 truncate"
                        style={{ fontFamily: stack(font) }}
                    >
                        {font}
                    </div>
                    <FontControls font={font} controls={controls} setControls={setControls} lhValue={lhValue} setLh={setLh} />
                </PopoverContent>
            </Popover>
        </div>
    );
}

function Section({ icon: Icon, title, aside, children }) {
    return (
        <div className="flex flex-col mb-5 last:mb-0">
            <div className="flex items-center justify-between mb-3 pl-1">
                <div className="flex items-center gap-2">
                    <Icon size={12} className="text-muted-foreground" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {title}
                    </span>
                </div>
                {aside}
            </div>
            {children}
        </div>
    );
}

/**
 * The app's one bottom-anchored control surface: a chat-style input whose
 * text becomes the specimen's dummy text (bound live, no submit step), plus
 * a "Tune" drawer that absorbs everything the old left sidebar held —
 * category/weight/italic filters, line height, and the per-font search +
 * size/weight/leading/tracking controls. Nothing lost, just tucked away by
 * default so the type stays the thing you're looking at.
 */
export default function TypeDock({
    sampleText, setSampleText,
    primaryFont, setPrimaryFont,
    secondaryFont, setSecondaryFont,
    pControls, setPControls,
    sControls, setSControls,
    primaryLocked, setPrimaryLocked,
    secondaryLocked, setSecondaryLocked,
    fontList,
    bodyLineHeight, setBodyLineHeight,
    onFilteredListChange,
    isTuneOpen, setIsTuneOpen,
    generateRandomPair,
    onFontAdded,
}) {
    const dockRef = useRef(null);
    const textareaRef = useRef(null);
    const spinRef = useRef(null);
    const fontFileRef = useRef(null);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedWeights, setSelectedWeights] = useState([]);
    const [requireItalic, setRequireItalic] = useState(false);
    const [fontDragOver, setFontDragOver] = useState(false);
    const [fontUploading, setFontUploading] = useState(false);
    const [fontUploadError, setFontUploadError] = useState(null);

    // This is the "from anywhere" entry point, not scoped to a slot the way
    // a per-font search popover is — so it defaults the result to Primary,
    // the one that's front and centre in every view, rather than just
    // registering it and leaving the person to go find it in a list.
    const handleFontFile = async (file) => {
        if (!file) return;
        setFontUploadError(null);
        setFontUploading(true);
        try {
            const family = await loadCustomFont(file);
            setPrimaryFont(family);
            onFontAdded?.(family);
        } catch (err) {
            setFontUploadError(err.message || 'Could not load that font.');
        } finally {
            setFontUploading(false);
        }
    };

    const hasFilters = selectedCategories.length > 0 || selectedWeights.length > 0 || requireItalic;
    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedWeights([]);
        setRequireItalic(false);
    };

    const filteredList = useMemo(() => {
        return fontList.filter(fName => {
            const meta = FONT_METADATA.find(m => m.family === fName);
            if (!meta) return true; // Keep local fonts

            if (selectedCategories.length > 0 && !selectedCategories.includes(meta.category)) return false;
            if (requireItalic && !meta.hasItalic) return false;
            if (selectedWeights.length > 0) {
                const hasMatchingWeight = selectedWeights.some(label => {
                    const group = WEIGHT_GROUPS.find(w => w.label === label);
                    return meta.weights.some(w => w >= group.min && w <= group.max);
                });
                if (!hasMatchingWeight) return false;
            }
            return true;
        });
    }, [fontList, selectedCategories, selectedWeights, requireItalic]);

    useEffect(() => {
        if (onFilteredListChange) onFilteredListChange(filteredList);
    }, [filteredList]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggle = (list, setList) => (value) =>
        setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);

    const handleGenerate = () => {
        generateRandomPair();
        if (spinRef.current && !prefersReducedMotion()) {
            gsap.fromTo(spinRef.current, { rotate: 0 }, { rotate: 360, duration: 0.6, ease: 'back.out(1.4)' });
        }
    };

    // Auto-grow the textarea with content, capped so it can't swallow the screen.
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [sampleText]);

    // Click outside the dock closes the Tune drawer.
    useEffect(() => {
        if (!isTuneOpen) return;
        const handler = (e) => {
            if (dockRef.current && !dockRef.current.contains(e.target)) setIsTuneOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isTuneOpen, setIsTuneOpen]);

    // Entrance for the bar itself.
    useGSAP(
        () => {
            if (prefersReducedMotion()) return;
            gsap.from(gsap.utils.selector(dockRef)('[data-bar]'), {
                opacity: 0,
                y: 24,
                duration: DUR.slow,
                ease: EASE.out,
                delay: 0.15,
            });
        },
        { scope: dockRef }
    );

    return (
        <div
            ref={dockRef}
            className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-3 px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+78px)] lg:pb-6 pointer-events-none"
        >

            {/* The pairing itself — centered above the bar, not tucked in a
                rail that only existed on desktop. */}
            <div data-bar className="pointer-events-auto flex items-center gap-2">
                <FontPill
                    font={primaryFont}
                    isLocked={primaryLocked}
                    onToggleLock={() => setPrimaryLocked(!primaryLocked)}
                    controls={pControls}
                    setControls={setPControls}
                    lhValue={pControls.lh}
                    setLh={(v) => setPControls({ ...pControls, lh: v })}
                />
                <FontPill
                    font={secondaryFont}
                    isLocked={secondaryLocked}
                    onToggleLock={() => setSecondaryLocked(!secondaryLocked)}
                    controls={sControls}
                    setControls={setSControls}
                    lhValue={bodyLineHeight}
                    setLh={setBodyLineHeight}
                />
            </div>

            <div
                data-bar
                className="pointer-events-auto w-full max-w-[640px] bg-background/90 backdrop-blur-xl border border-border rounded-[32px] shadow-xl overflow-hidden"
            >
                {/* Morph region. grid-rows 0fr -> 1fr animates to the content's
                    natural height without hard-coding one, and the whole dock
                    is bottom-anchored, so this opens upward on its own. */}
                <div
                    className={cn(
                        "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                        isTuneOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                >
                    {/* Collapsed, this region stays in the DOM at zero height,
                        so inert keeps its controls out of the tab order and
                        away from screen readers. */}
                    <div className="overflow-hidden">
                        <div
                            className="max-h-[min(55vh,460px)] overflow-y-auto scrollbar-hide px-4 pt-4 sm:px-5 sm:pt-5"
                            {...(isTuneOpen ? {} : { inert: true, 'aria-hidden': 'true' })}
                            /* A font file can be dropped anywhere in this panel,
                               not just on the upload row — the row is the
                               discoverable target, this is the forgiving one. */
                            onDragOver={(e) => { e.preventDefault(); setFontDragOver(true); }}
                            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFontDragOver(false); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                setFontDragOver(false);
                                handleFontFile(e.dataTransfer.files?.[0]);
                            }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[13px] font-semibold text-foreground">Tune</span>
                                <button
                                    onClick={() => setIsTuneOpen(false)}
                                    aria-label="Close tune panel"
                                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                    <Section
                        icon={Filter}
                        title="Filters"
                        aside={
                            <div className="flex items-center gap-3">
                                {hasFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider flex items-center gap-1"
                                    >
                                        <XCircle size={10} strokeWidth={2.5} /> Clear
                                    </button>
                                )}
                                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
                                    {filteredList.length}
                                </span>
                            </div>
                        }
                    >
                        <div className="flex flex-col gap-4 p-4 bg-card rounded-xl border">
                            <div className="flex flex-col gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => fontFileRef.current?.click()}
                                    disabled={fontUploading}
                                    className={cn(
                                        "flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-dashed text-[11px] font-medium transition-colors",
                                        fontDragOver
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                                    )}
                                >
                                    <Upload size={13} className="shrink-0" />
                                    {fontUploading ? 'Loading font…' : fontDragOver ? 'Drop to load' : 'Upload your own font — click or drop anywhere here'}
                                </button>
                                <input
                                    ref={fontFileRef}
                                    type="file"
                                    accept=".ttf,.otf,.woff,.woff2"
                                    className="hidden"
                                    onChange={(e) => handleFontFile(e.target.files?.[0])}
                                />
                                {fontUploadError && (
                                    <span className="text-[10px] text-destructive px-1">{fontUploadError}</span>
                                )}
                            </div>

                            <div className="h-px bg-border/60 w-full" />

                            <div className="flex flex-col gap-3">
                                <span className="text-[11px] font-medium text-foreground">Category</span>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map(cat => (
                                        <Pill
                                            key={cat}
                                            active={selectedCategories.includes(cat)}
                                            onClick={() => toggle(selectedCategories, setSelectedCategories)(cat)}
                                        >
                                            {cat}
                                        </Pill>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-border/60 w-full" />

                            <div className="flex flex-col gap-3">
                                <span className="text-[11px] font-medium text-foreground">Weight & Style</span>
                                <div className="flex flex-wrap gap-2">
                                    {WEIGHT_GROUPS.map(w => (
                                        <Pill
                                            key={w.label}
                                            active={selectedWeights.includes(w.label)}
                                            onClick={() => toggle(selectedWeights, setSelectedWeights)(w.label)}
                                        >
                                            {w.label}
                                        </Pill>
                                    ))}
                                    <Pill
                                        active={requireItalic}
                                        onClick={() => setRequireItalic(!requireItalic)}
                                        className="italic"
                                    >
                                        Italic
                                    </Pill>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Accordion type="multiple" defaultValue={["primary", "secondary"]} className="w-full">
                        {[
                            {
                                value: 'primary', label: 'Primary', font: primaryFont, setFont: setPrimaryFont,
                                controls: pControls, setControls: setPControls, locked: primaryLocked,
                                lhValue: pControls.lh, setLh: (v) => setPControls({ ...pControls, lh: v }),
                            },
                            {
                                value: 'secondary', label: 'Secondary', font: secondaryFont, setFont: setSecondaryFont,
                                controls: sControls, setControls: setSControls, locked: secondaryLocked,
                                lhValue: bodyLineHeight, setLh: setBodyLineHeight,
                            },
                        ].map((item) => (
                            <AccordionItem key={item.value} value={item.value} className="border-b-0 mb-3 last:mb-0">
                                <AccordionTrigger className="w-full py-3 px-4 bg-card border rounded-xl data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline font-semibold text-[10px] uppercase tracking-widest text-muted-foreground transition-all focus:ring-0">
                                    <div className="flex flex-col items-start text-left gap-1 min-w-0">
                                        <span>{item.label} {item.locked && '· Locked'}</span>
                                        <span className="text-[15px] font-medium text-foreground normal-case tracking-normal truncate max-w-[240px]">
                                            {item.font}
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-5 px-4 pb-5 border border-t-0 rounded-b-xl bg-card/50">
                                    <FontSection
                                        font={item.font}
                                        setFont={item.setFont}
                                        controls={item.controls}
                                        setControls={item.setControls}
                                        lhValue={item.lhValue}
                                        setLh={item.setLh}
                                        fontList={filteredList}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                            <div className="h-3" />
                        </div>
                    </div>
                </div>

                <div
                    className={cn(
                        "flex items-end gap-1.5 px-2.5 py-2.5 transition-[border-color] duration-300",
                        isTuneOpen ? "border-t border-border/70" : "border-t border-transparent"
                    )}
                >
                <button
                    onClick={() => setIsTuneOpen(v => !v)}
                    aria-pressed={isTuneOpen}
                    aria-label="Tune fonts, filters and weight"
                    className={cn(
                        "shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                        isTuneOpen ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <SlidersHorizontal size={16} />
                </button>

                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={sampleText}
                    onChange={(e) => setSampleText(e.target.value)}
                    placeholder="Type your own text…"
                    aria-label="Sample text"
                    className="flex-1 resize-none bg-transparent outline-none text-[14px] text-foreground placeholder:text-muted-foreground/50 leading-relaxed py-1.5 px-1 max-h-[160px] scrollbar-hide"
                />

                {sampleText && (
                    <button
                        onClick={() => setSampleText('')}
                        aria-label="Clear sample text"
                        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X size={15} />
                    </button>
                )}

                <button
                    onClick={handleGenerate}
                    aria-label="Generate new font pair"
                    title="Generate new font pair (Space)"
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-primary-foreground bg-primary hover:bg-primary/95 shadow-[0_4px_16px_hsl(var(--primary)/0.3)] transition-all duration-200 hover:scale-105 active:scale-95"
                >
                    <span ref={spinRef} className="flex">
                        <RefreshCw size={16} />
                    </span>
                </button>
                </div>
            </div>
        </div>
    );
}
