import { motion } from 'framer-motion';
import { X, PanelLeft, Filter, XCircle, AlignLeft } from 'lucide-react';
import FontSection from './FontSection';
import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { FONT_METADATA } from '../data/fonts';
import { cn } from "@/lib/utils";

const CATEGORIES = ['Sans Serif', 'Serif', 'Display', 'Handwriting', 'Monospace'];
const WEIGHT_GROUPS = [
    { label: 'Light', min: 100, max: 300 },
    { label: 'Regular', min: 400, max: 500 },
    { label: 'Bold', min: 600, max: 900 }
];

export default function Sidebar({
    primaryFont, setPrimaryFont,
    secondaryFont, setSecondaryFont,
    pControls, setPControls,
    sControls, setSControls,
    sampleText, setSampleText,
    generateRandomPair,
    primaryLocked, secondaryLocked,
    isOpen, onClose,
    isDesktopOpen, setDesktopOpen,
    fontList,
    bodyLineHeight, setBodyLineHeight,
    onFilteredListChange,
}) {
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedWeights, setSelectedWeights] = useState([]);
    const [requireItalic, setRequireItalic] = useState(false);

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

            if (selectedCategories.length > 0 && !selectedCategories.includes(meta.category)) {
                return false;
            }
            if (requireItalic && !meta.hasItalic) {
                return false;
            }
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

    // Notify parent whenever the filtered list changes
    useEffect(() => {
        if (onFilteredListChange) onFilteredListChange(filteredList);
    }, [filteredList]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleCategory = (cat) => {
        if (selectedCategories.includes(cat)) setSelectedCategories(selectedCategories.filter(c => c !== cat));
        else setSelectedCategories([...selectedCategories, cat]);
    };

    const toggleWeight = (w) => {
        if (selectedWeights.includes(w)) setSelectedWeights(selectedWeights.filter(x => x !== w));
        else setSelectedWeights([...selectedWeights, w]);
    };

    return (
        <motion.aside
            className={`
                fixed lg:relative top-0 left-0 z-50 h-[100dvh] lg:h-full flex flex-col bg-background/95 lg:bg-background/50 backdrop-blur-3xl transition-all duration-300 overflow-hidden shrink-0
                ${isOpen ? 'translate-x-0 shadow-2xl border-r border-border' : '-translate-x-full lg:shadow-none'} 
                ${isDesktopOpen ? 'lg:w-80 lg:min-w-[320px] lg:border-r lg:border-border lg:translate-x-0 lg:opacity-100' : 'lg:w-0 lg:min-w-0 lg:border-none lg:-translate-x-full lg:opacity-0 lg:p-0'}
                w-[85vw] max-w-[320px]
            `}
            initial={false}
        >
            <div className="w-[85vw] max-w-[320px] lg:w-80 h-[100dvh] lg:h-full overflow-y-auto overflow-x-hidden p-5 lg:p-6 lg:pb-2 flex flex-col scrollbar-hide pt-10 lg:pt-6">
                <div className="flex items-center justify-between mb-6 lg:mb-8 pl-1">
                    <div className="text-2xl font-light tracking-tight text-foreground">
                        JustMy<span className="font-extrabold">Type</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setDesktopOpen(false)} className="hidden lg:flex p-2 bg-transparent rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <PanelLeft size={20} />
                        </button>
                        <button onClick={onClose} className="lg:hidden p-2 bg-muted/50 rounded-full text-muted-foreground hover:text-foreground">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col mb-6">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">SAMPLE TEXT</span>
                    <div className="bg-card rounded-xl overflow-hidden p-4 border">
                        <Textarea
                            className="w-full border-none outline-none bg-transparent text-[13px] text-foreground font-sans leading-relaxed resize-none min-h-[80px] p-0 focus-visible:ring-0 shadow-none"
                            placeholder="Type something to preview..."
                            value={sampleText}
                            onChange={(e) => setSampleText(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col mb-6">
                    <div className="flex items-center justify-between mb-3 pl-1">
                        <div className="flex items-center gap-2">
                            <Filter size={12} className="text-muted-foreground" />
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">FILTERS</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {hasFilters && (
                                <button onClick={clearFilters} className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider flex items-center gap-1">
                                    <XCircle size={10} strokeWidth={2.5} /> Clear
                                </button>
                            )}
                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{filteredList.length}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-4 p-4 bg-card rounded-xl border">
                        <div className="flex flex-col gap-3">
                            <span className="text-[11px] font-medium text-foreground">Category</span>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => toggleCategory(cat)}
                                        className={cn(
                                            "text-[11px] px-3 py-1.5 rounded-full border transition-all duration-200 font-medium",
                                            selectedCategories.includes(cat) 
                                                ? "bg-primary text-primary-foreground border-primary shadow-md" 
                                                : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-px bg-border/60 w-full" />

                        <div className="flex flex-col gap-3">
                            <span className="text-[11px] font-medium text-foreground">Weight & Style</span>
                            <div className="flex flex-wrap gap-2">
                                {WEIGHT_GROUPS.map(w => (
                                    <button
                                        key={w.label}
                                        onClick={() => toggleWeight(w.label)}
                                        className={cn(
                                            "text-[11px] px-3 py-1.5 rounded-full border transition-all duration-200 font-medium",
                                            selectedWeights.includes(w.label)
                                                ? "bg-primary text-primary-foreground border-primary shadow-md"
                                                : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                                        )}
                                    >
                                        {w.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setRequireItalic(!requireItalic)}
                                    className={cn(
                                        "text-[11px] px-3 py-1.5 rounded-full border transition-all duration-200 font-medium italic select-none",
                                        requireItalic 
                                            ? "bg-primary text-primary-foreground border-primary shadow-md" 
                                            : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                                    )}
                                >
                                    Italic
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Height Control */}
                <div className="flex flex-col mb-6">
                    <div className="flex items-center justify-between mb-3 pl-1">
                        <div className="flex items-center gap-2">
                            <AlignLeft size={12} className="text-muted-foreground" />
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">LINE HEIGHT</span>
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {bodyLineHeight.toFixed(2)}×
                        </span>
                    </div>
                    <div className="p-4 bg-card rounded-xl border">
                        <Slider
                            min={1.0}
                            max={2.5}
                            step={0.05}
                            value={[bodyLineHeight]}
                            onValueChange={(val) => setBodyLineHeight(val[0])}
                        />
                        <div className="flex justify-between mt-2">
                            <span className="text-[10px] text-muted-foreground/60">Tight (1.0)</span>
                            <span className="text-[10px] text-muted-foreground/60">Loose (2.5)</span>
                        </div>
                    </div>
                </div>

                <Accordion type="multiple" defaultValue={["primary", "secondary"]} className="w-full mb-6 relative z-10">
                    <AccordionItem value="primary" className="border-b-0 mb-3">
                        <AccordionTrigger className="w-full py-3 px-4 bg-card border rounded-xl data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline font-semibold text-[10px] uppercase tracking-widest text-muted-foreground transition-all focus:ring-0">
                            <div className="flex flex-col items-start text-left gap-1">
                                <span>PRIMARY {primaryLocked && '(LOCKED)'}</span>
                                <span className="text-[15px] font-medium text-foreground capitalize normal-case tracking-normal">{primaryFont}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-5 px-4 pb-5 border border-t-0 rounded-b-xl bg-card/50">
                            <FontSection font={primaryFont} setFont={setPrimaryFont} controls={pControls} setControls={setPControls} fontList={filteredList} />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="secondary" className="border-b-0 relative">
                        <AccordionTrigger className="w-full py-3 px-4 bg-card border rounded-xl data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline font-semibold text-[10px] uppercase tracking-widest text-muted-foreground transition-all focus:ring-0">
                            <div className="flex flex-col items-start text-left gap-1">
                                <span>SECONDARY {secondaryLocked && '(LOCKED)'}</span>
                                <span className="text-[15px] font-medium text-foreground capitalize normal-case tracking-normal">{secondaryFont}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-5 px-4 pb-5 border border-t-0 rounded-b-xl bg-card/50">
                            <FontSection font={secondaryFont} setFont={setSecondaryFont} controls={sControls} setControls={setSControls} fontList={filteredList} />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </motion.aside>
    );
}
