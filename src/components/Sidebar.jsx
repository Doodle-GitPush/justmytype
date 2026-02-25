import { motion } from 'framer-motion';
import { X, PanelLeft } from 'lucide-react';
import FontSection from './FontSection';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

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
    fontList
}) {
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
                    <div className="bg-card rounded-xl overflow-hidden p-4 border shadow-sm">
                        <Textarea
                            className="w-full border-none outline-none bg-transparent text-[13px] text-foreground font-sans leading-relaxed resize-none min-h-[80px] p-0 focus-visible:ring-0 shadow-none"
                            placeholder="Type something to preview..."
                            value={sampleText}
                            onChange={(e) => setSampleText(e.target.value)}
                        />
                    </div>
                </div>

                <Accordion type="multiple" defaultValue={["primary", "secondary"]} className="w-full mb-6">
                    <AccordionItem value="primary" className="border-b-0 mb-3">
                        <AccordionTrigger className="w-full py-3 px-4 bg-card border rounded-xl data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline font-semibold text-[10px] uppercase tracking-widest text-muted-foreground transition-all">
                            <div className="flex flex-col items-start text-left gap-1">
                                <span>PRIMARY {primaryLocked && '(LOCKED)'}</span>
                                <span className="text-[15px] font-medium text-foreground capitalize normal-case tracking-normal">{primaryFont}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-5 px-4 pb-5 border border-t-0 rounded-b-xl bg-card/50">
                            <FontSection font={primaryFont} setFont={setPrimaryFont} controls={pControls} setControls={setPControls} fontList={fontList} />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="secondary" className="border-b-0 relative">
                        <AccordionTrigger className="w-full py-3 px-4 bg-card border rounded-xl data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline font-semibold text-[10px] uppercase tracking-widest text-muted-foreground transition-all">
                            <div className="flex flex-col items-start text-left gap-1">
                                <span>SECONDARY {secondaryLocked && '(LOCKED)'}</span>
                                <span className="text-[15px] font-medium text-foreground capitalize normal-case tracking-normal">{secondaryFont}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-5 px-4 pb-5 border border-t-0 rounded-b-xl bg-card/50">
                            <FontSection font={secondaryFont} setFont={setSecondaryFont} controls={sControls} setControls={setSControls} fontList={fontList} />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </motion.aside>
    );
}
