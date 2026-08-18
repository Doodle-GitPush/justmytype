import { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { FONTS } from '../data/fonts';
import { loadFont } from '../lib/fontLoader';
import { stack } from '../lib/typeStyles';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import FontControls from './FontControls';

/** Rendering ~1,900 items at once locks the thread; show a window until they search. */
const INITIAL_VISIBLE = 60;

export default function FontSection({ font, setFont, controls, setControls, lhValue, setLh, fontList = FONTS }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    useEffect(() => { loadFont(font); }, [font]);

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

            <FontControls font={font} controls={controls} setControls={setControls} lhValue={lhValue} setLh={setLh} />
        </div>
    );
}
