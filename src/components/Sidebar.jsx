import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
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
    primaryLocked, secondaryLocked
}) {
    const [isSpinning, setIsSpinning] = useState(false);

    const handleGenerate = (e) => {
        generateRandomPair();
        setIsSpinning(true);
        setTimeout(() => setIsSpinning(false), 500);
    };

    return (
        <motion.aside
            className="w-80 h-full flex flex-col bg-background/50 backdrop-blur-3xl border-r border-border z-20 relative flex-shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pb-2 flex flex-col scrollbar-hide">
                <div className="text-2xl font-light tracking-tight mb-8 text-foreground pl-1">
                    JustMy<span className="font-extrabold">Type</span>
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
                            <FontSection font={primaryFont} setFont={setPrimaryFont} controls={pControls} setControls={setPControls} />
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
                            <FontSection font={secondaryFont} setFont={setSecondaryFont} controls={sControls} setControls={setSControls} />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            <div className="p-5 bg-background border-t border-border z-10">
                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ scale: [1, 1.01, 1] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                    <Button
                        className="w-full h-12 rounded-xl text-[14px] font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2.5 transition-all text-background dark:text-foreground bg-primary"
                        onClick={handleGenerate}
                    >
                        <motion.div
                            animate={{ rotate: isSpinning ? 360 : 0 }}
                            transition={{ duration: 0.5, ease: "backOut" }}
                        >
                            <RefreshCw size={18} />
                        </motion.div>
                        Generate Pair
                    </Button>
                </motion.div>
            </div>
        </motion.aside>
    );
}
