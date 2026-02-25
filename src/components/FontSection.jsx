import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { FONTS } from '../data/fonts';
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// Dynamically inject Google Fonts when a font is selected/loaded
const loadedFonts = new Set();
const loadFont = (fontName) => {
    if (loadedFonts.has(fontName)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
    document.head.appendChild(link);
    loadedFonts.add(fontName);
};

export default function FontSection({ font, setFont, controls, setControls, fontList = FONTS }) {
    const [open, setOpen] = useState(false);

    // Auto-load current font whenever it changes via the random generator
    useMemo(() => loadFont(font), [font]);

    return (
        <div className="flex flex-col">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between mb-6 h-10 px-3 font-normal"
                        style={{ fontFamily: `'${font}', sans-serif` }}
                    >
                        {font || "Select font..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[245px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search fonts..." className="font-sans" />
                        <CommandList>
                            <CommandEmpty>No font found.</CommandEmpty>
                            <CommandGroup>
                                {fontList.map((f) => (
                                    <CommandItem
                                        key={f}
                                        value={f}
                                        onSelect={(currentValue) => {
                                            setFont(f);
                                            loadFont(f);
                                            setOpen(false);
                                        }}
                                        style={{ fontFamily: `'${f}', sans-serif` }}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                font === f ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <span className="truncate">{f}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Size */}
            <div className="flex justify-between items-center mb-3">
                <span className="text-[13px] font-medium text-muted-foreground">Size</span>
                <span className="text-[13px] text-muted-foreground">{controls.size}px</span>
            </div>
            <Slider
                min={12} max={120} step={1}
                value={[controls.size]}
                onValueChange={(val) => setControls({ ...controls, size: val[0] })}
            />

            {/* Weight */}
            <div className="flex justify-between items-center mt-6 mb-3">
                <span className="text-[13px] font-medium text-muted-foreground">Weight</span>
                <span className="text-[13px] text-muted-foreground">{controls.weight}</span>
            </div>
            <Slider
                min={300} max={800} step={100}
                value={[controls.weight]}
                onValueChange={(val) => setControls({ ...controls, weight: val[0] })}
            />

            {/* Line Height */}
            <div className="flex justify-between items-center mt-6 mb-3">
                <span className="text-[13px] font-medium text-muted-foreground">Line Height</span>
                <span className="text-[13px] text-muted-foreground">{controls.lh}</span>
            </div>
            <Slider
                min={0.8} max={2.5} step={0.05}
                value={[controls.lh]}
                onValueChange={(val) => setControls({ ...controls, lh: val[0] })}
            />

            {/* Letter Spacing */}
            <div className="flex justify-between items-center mt-6 mb-3">
                <span className="text-[13px] font-medium text-muted-foreground">Letter Spacing</span>
                <span className="text-[13px] text-muted-foreground">{controls.ls} em</span>
            </div>
            <Slider
                min={-0.1} max={0.5} step={0.01}
                value={[controls.ls]}
                onValueChange={(val) => setControls({ ...controls, ls: val[0] })}
            />
        </div>
    );
}
