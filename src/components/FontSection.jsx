import { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { FONTS, FONT_METADATA } from '../data/fonts';
import { loadFont } from '../lib/fontLoader';
import { stack } from '../lib/typeStyles';
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Rendering ~1,900 items at once locks the thread; show a window until they search. */
const INITIAL_VISIBLE = 60;

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

export default function FontSection({ font, setFont, controls, setControls, fontList = FONTS }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    useEffect(() => { loadFont(font); }, [font]);

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

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return fontList.slice(0, INITIAL_VISIBLE);
        return fontList.filter(f => f.toLowerCase().includes(q)).slice(0, 100);
    }, [fontList, query]);

    const hiddenCount = !query.trim() ? Math.max(0, fontList.length - results.length) : 0;

    return (
        <div className="flex flex-col">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between mb-6 h-10 px-3 font-normal"
                        style={{ fontFamily: stack(font) }}
                    >
                        <span className="truncate">{font || "Select font…"}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[245px] p-0" align="start">
                    {/* We filter ourselves — cmdk's scorer would walk all 1,900 per keystroke. */}
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Search fonts…"
                            value={query}
                            onValueChange={setQuery}
                        />
                        <CommandList>
                            <CommandEmpty>No font found.</CommandEmpty>
                            <CommandGroup>
                                {results.map((f) => (
                                    <CommandItem
                                        key={f}
                                        value={f}
                                        onSelect={() => { setFont(f); loadFont(f); setOpen(false); }}
                                        style={{ fontFamily: stack(f) }}
                                        className="cursor-pointer"
                                    >
                                        <Check className={cn("mr-2 h-4 w-4 shrink-0", font === f ? "opacity-100" : "opacity-0")} />
                                        <span className="truncate">{f}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            {hiddenCount > 0 && (
                                <div className="px-3 py-2.5 text-[11px] text-muted-foreground border-t border-border">
                                    +{hiddenCount.toLocaleString()} more — start typing to search
                                </div>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

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
                label="Line Height" display={controls.lh}
                min={0.8} max={2.5} step={0.05}
                value={controls.lh}
                onValueChange={(val) => setControls({ ...controls, lh: val[0] })}
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
