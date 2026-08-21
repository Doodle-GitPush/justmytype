import { useState, useEffect, useMemo, useRef } from 'react';
import { Check, ChevronsUpDown, Upload } from 'lucide-react';
import { FONTS, loadCustomFont } from '../data/fonts';
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
    const [uploadError, setUploadError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => { loadFont(font); }, [font]);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return fontList.slice(0, INITIAL_VISIBLE);
        return fontList.filter(f => f.toLowerCase().includes(q)).slice(0, 100);
    }, [fontList, query]);

    const hiddenCount = !query.trim() ? Math.max(0, fontList.length - results.length) : 0;

    const handleFile = async (file) => {
        if (!file) return;
        setUploadError(null);
        setUploading(true);
        try {
            const family = await loadCustomFont(file);
            setFont(family);
            setOpen(false);
        } catch (err) {
            setUploadError(err.message || 'Could not load that font.');
        } finally {
            setUploading(false);
        }
    };

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
                <PopoverContent
                    className="w-[245px] p-0"
                    align="start"
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        handleFile(e.dataTransfer.files?.[0]);
                    }}
                >
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

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".ttf,.otf,.woff,.woff2"
                            className="hidden"
                            onChange={(e) => handleFile(e.target.files?.[0])}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className={cn(
                                "flex items-center gap-2 w-full px-3 py-2.5 text-[12px] border-t border-border transition-colors",
                                dragOver ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Upload className="h-3.5 w-3.5 shrink-0" />
                            {uploading ? 'Loading font…' : dragOver ? 'Drop to load' : 'Upload your own font…'}
                        </button>
                        {uploadError && (
                            <div className="px-3 py-2 text-[11px] text-destructive border-t border-border">
                                {uploadError}
                            </div>
                        )}
                    </Command>
                </PopoverContent>
            </Popover>

            <FontControls font={font} controls={controls} setControls={setControls} lhValue={lhValue} setLh={setLh} />
        </div>
    );
}
