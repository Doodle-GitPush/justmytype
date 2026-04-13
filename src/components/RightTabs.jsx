import { motion } from 'framer-motion';
import { Lock, Unlock, RefreshCw, Info } from 'lucide-react';
import { useState } from 'react';
import { TABS } from '../data/constants';

export default function RightTabs({
    activeTab, setActiveTab,
    primaryFont, secondaryFont,
    primaryLocked, setPrimaryLocked,
    secondaryLocked, setSecondaryLocked,
    THEMES, theme, setTheme,
    generateRandomPair,
    onShowFontInfo,
}) {
    const [isSpinning, setIsSpinning] = useState(false);

    const handleGenerate = () => {
        generateRandomPair();
        setIsSpinning(true);
        setTimeout(() => setIsSpinning(false), 500);
    };

    return (
        <motion.nav
            className="hidden lg:flex w-[260px] min-w-[260px] h-full flex-col justify-center items-stretch gap-3 py-5 pr-8 pl-3 bg-background shrink-0 z-10 relative"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
            <div className="flex flex-col gap-2 w-full">
                <Badge
                    label="PRIMARY FONT" font={primaryFont}
                    isLocked={primaryLocked} onToggleLock={() => setPrimaryLocked(!primaryLocked)}
                    onInfo={() => onShowFontInfo(primaryFont)}
                />
                <Badge
                    label="SECONDARY FONT" font={secondaryFont}
                    isLocked={secondaryLocked} onToggleLock={() => setSecondaryLocked(!secondaryLocked)}
                    onInfo={() => onShowFontInfo(secondaryFont)}
                />
            </div>

            <div className="bg-black/5 dark:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] p-1 flex flex-col relative mb-4">
                {TABS.map((tab) => {
                    const isActive = tab.id === activeTab;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`flex items-center gap-2.5 py-2.5 px-4 shrink-0 border-none rounded-[10px] bg-transparent text-[14px] font-medium text-left relative z-10 transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setActiveTab(tab.id)}
                            style={{ position: 'relative' }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute inset-0 bg-card rounded-[14px] shadow-sm z-0"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2.5">
                                <Icon size={18} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Accent Color Picker */}
            <div className="flex flex-col gap-3 px-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Accent Color</span>
                <div className="flex items-center gap-3">
                    {THEMES.map((t) => (
                        <button
                            key={t.name}
                            onClick={() => setTheme(t.name)}
                            className={`w-5 h-5 rounded-full transition-all hover:scale-110 ${t.hex} ${theme === t.name ? 'ring-2 ring-offset-2 ring-offset-background ring-primary border-transparent' : 'border border-black/10 dark:border-white/10'}`}
                            title={t.name.charAt(0).toUpperCase() + t.name.slice(1)}
                        />
                    ))}
                </div>
            </div>

            {/* Keyboard Shortcut Hint */}
            <div className="px-2">
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('jmt:showShortcuts'))}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                    <kbd className="text-[10px] px-1.5 py-0.5 bg-muted border border-border rounded font-mono">?</kbd>
                    Keyboard shortcuts
                </button>
            </div>

            <div className="mt-4 pt-5 border-t border-border">
                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ scale: [1, 1.01, 1] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                    <button
                        className="w-full h-12 rounded-xl text-[14px] font-semibold shadow-[0_4px_16px_rgba(37,99,235,0.2)] flex items-center justify-center gap-2.5 transition-all text-white bg-primary hover:bg-primary/95"
                        onClick={handleGenerate}
                    >
                        <motion.div
                            animate={{ rotate: isSpinning ? 360 : 0 }}
                            transition={{ duration: 0.5, ease: "backOut" }}
                        >
                            <RefreshCw size={18} />
                        </motion.div>
                        Generate Pair
                        <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.5 bg-white/20 border border-white/30 rounded font-mono ml-1">Space</kbd>
                    </button>
                </motion.div>
            </div>
        </motion.nav>
    );
}

function Badge({ label, font, isLocked, onToggleLock, onInfo }) {
    return (
        <motion.div
            className={`flex items-stretch border rounded-xl h-16 w-full shadow-sm transition-colors duration-200 ${isLocked
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-card border-border/80 text-foreground'
                }`}
            whileHover={{ y: -2, boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
            {/* Lock toggle area (click to lock) */}
            <button
                className="flex flex-col justify-center px-4 gap-0.5 flex-1 min-w-0 text-left"
                onClick={onToggleLock}
            >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isLocked ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {label}
                </span>

                <div className="flex items-center justify-between mt-0.5">
                    <motion.div
                        key={font}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[15px] font-medium whitespace-nowrap overflow-hidden text-ellipsis tracking-tight"
                        style={{ fontFamily: `'${font}', sans-serif` }}
                    >
                        {font}
                    </motion.div>

                    <div className={`p-1 flex items-center justify-center rounded-md transition-colors ${isLocked ? 'text-primary-foreground' : 'text-muted-foreground/50'}`}>
                        {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                    </div>
                </div>
            </button>

            {/* Info button — separate tap target */}
            <button
                onClick={(e) => { e.stopPropagation(); onInfo(); }}
                className={`shrink-0 w-10 flex items-center justify-center border-l transition-colors rounded-r-xl ${isLocked
                    ? 'border-primary-foreground/20 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10'
                    : 'border-border/60 text-muted-foreground/50 hover:text-foreground hover:bg-muted/50'
                    }`}
                title="Font info"
            >
                <Info size={14} />
            </button>
        </motion.div>
    );
}
