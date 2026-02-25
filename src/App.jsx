import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Check, Copy, RefreshCw, PanelLeft } from 'lucide-react';
import Sidebar from './components/Sidebar';
import PreviewArea from './components/PreviewArea';
import RightTabs from './components/RightTabs';
import { TABS } from './data/constants';
import { FONTS } from './data/fonts';
import { SAMPLE } from './data/content';

import { Switch } from "@/components/ui/switch";
import { Analytics } from "@vercel/analytics/react";

const THEMES = [
  { name: 'blue', color: '#3b82f6', hex: 'bg-blue-500' },
  { name: 'zinc', color: '#18181b', hex: 'bg-zinc-900 dark:bg-zinc-100' },
  { name: 'rose', color: '#e11d48', hex: 'bg-rose-500' },
  { name: 'green', color: '#16a34a', hex: 'bg-green-600' },
  { name: 'orange', color: '#f97316', hex: 'bg-orange-500' },
];

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [theme, setTheme] = useState('blue');
  const [activeTab, setActiveTab] = useState('article');

  // Primary Font State
  const [primaryFont, setPrimaryFont] = useState('Plus Jakarta Sans');
  const [primaryLocked, setPrimaryLocked] = useState(false);
  const [primaryControls, setPrimaryControls] = useState({ size: 24, weight: 700, lh: 1.3, ls: 0 });

  // Secondary Font State
  const [secondaryFont, setSecondaryFont] = useState('Urbanist');
  const [secondaryLocked, setSecondaryLocked] = useState(false);
  const [secondaryControls, setSecondaryControls] = useState({ size: 16, weight: 400, lh: 1.7, ls: 0 });

  const [sampleText, setSampleText] = useState(SAMPLE.title);
  const [copied, setCopied] = useState(false);

  // Theme observer
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    // Apply accent color theme
    THEMES.forEach(t => root.classList.remove(`theme-${t.name}`));
    if (theme !== 'blue') {
      root.classList.add(`theme-${theme}`);
    }
  }, [isDark, theme]);

  const handleCopyCss = () => {
    const encP = primaryFont.replace(/ /g, '+');
    const encS = secondaryFont.replace(/ /g, '+');
    const css = `/* JustMyType — Generated CSS */
@import url('https://fonts.googleapis.com/css2?family=${encP}:wght@300;400;500;600;700&family=${encS}:wght@300;400;500;600;700&display=swap');

.heading {
  font-family: '${primaryFont}', sans-serif;
  font-size: ${primaryControls.size}px;
  font-weight: ${primaryControls.weight};
  line-height: ${primaryControls.lh};
  letter-spacing: ${primaryControls.ls}em;
}

.body {
  font-family: '${secondaryFont}', sans-serif;
  font-size: ${secondaryControls.size}px;
  font-weight: ${secondaryControls.weight};
  line-height: ${secondaryControls.lh};
  letter-spacing: ${secondaryControls.ls}em;
}`;
    navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateRandomPair = () => {
    if (primaryLocked && secondaryLocked) return;

    let pi = FONTS.indexOf(primaryFont);
    let si = FONTS.indexOf(secondaryFont);

    if (!primaryLocked && !secondaryLocked) {
      pi = Math.floor(Math.random() * FONTS.length);
      do { si = Math.floor(Math.random() * FONTS.length); } while (si === pi);
    } else if (!primaryLocked) {
      do { pi = Math.floor(Math.random() * FONTS.length); } while (pi === si);
    } else {
      do { si = Math.floor(Math.random() * FONTS.length); } while (si === pi);
    }

    if (!primaryLocked) setPrimaryFont(FONTS[pi]);
    if (!secondaryLocked) setSecondaryFont(FONTS[si]);
  };

  return (
    <div className="w-screen min-h-[100dvh] lg:h-screen flex flex-col lg:flex-row bg-background overflow-y-auto overflow-x-hidden lg:overflow-hidden relative font-sans text-foreground">

      {/* Sidebar Desktop Toggle (Floating when closed) */}
      <AnimatePresence>
        {!isDesktopSidebarOpen && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setIsDesktopSidebarOpen(true)}
            className="hidden lg:flex absolute top-5 left-6 z-50 p-2.5 bg-background/80 backdrop-blur border border-border rounded-xl shadow-sm text-foreground hover:bg-muted transition-all"
          >
            <PanelLeft size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Action Button for Settings/Fonts Menu */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed bottom-[90px] right-4 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg border border-primary/20 flex items-center justify-center z-30 hover:scale-105 active:scale-95 transition-transform"
      >
        <span className="font-serif italic text-lg font-bold mt-0.5">Aa</span>
      </button>

      {/* Mobile Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-background/90 backdrop-blur-md border-t border-border z-40 px-2 py-2">
        <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-hide max-w-md mx-auto">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-colors ${isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted/50'}`}
              >
                <Icon size={18} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
          <div className="w-px h-8 bg-border/50 shrink-0 mx-1"></div>
          <button
            onClick={generateRandomPair}
            className="flex-shrink-0 flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-sm"
          >
            <RefreshCw size={18} />
            <span className="text-[10px] font-medium">Generate</span>
          </button>
        </div>
      </nav>

      {/* Floating Actions */}
      <div className="absolute top-4 right-4 lg:top-6 lg:right-8 flex items-center gap-2 lg:gap-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 bg-background/80 backdrop-blur border border-border px-3 py-2 lg:px-4 lg:py-2.5 rounded-full text-[12px] lg:text-[13px] font-semibold text-foreground shadow-sm transition-colors hover:bg-card ${copied ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}`}
          onClick={handleCopyCss}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy CSS'}
        </motion.button>

        {/* Dark Mode Toggle */}
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur border border-border px-2 py-1.5 lg:px-3 lg:py-2.5 rounded-full shadow-sm">
          <Sun size={14} className={!isDark ? 'text-foreground' : 'text-muted-foreground'} />
          <Switch
            checked={isDark}
            onCheckedChange={setIsDark}
          />
          <Moon size={14} className={isDark ? 'text-foreground' : 'text-muted-foreground'} />
        </div>
      </div>

      <Sidebar
        isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
        isDesktopOpen={isDesktopSidebarOpen} setDesktopOpen={setIsDesktopSidebarOpen}
        primaryFont={primaryFont} setPrimaryFont={setPrimaryFont}
        secondaryFont={secondaryFont} setSecondaryFont={setSecondaryFont}
        pControls={primaryControls} setPControls={setPrimaryControls}
        sControls={secondaryControls} setSControls={setSecondaryControls}
        sampleText={sampleText} setSampleText={setSampleText}
        generateRandomPair={generateRandomPair}
        primaryLocked={primaryLocked} secondaryLocked={secondaryLocked}
      />

      <PreviewArea
        activeTab={activeTab}
        primaryFont={primaryFont} pControls={primaryControls}
        secondaryFont={secondaryFont} sControls={secondaryControls}
        sampleText={sampleText}
      />

      <RightTabs
        activeTab={activeTab} setActiveTab={setActiveTab}
        primaryFont={primaryFont} secondaryFont={secondaryFont}
        primaryLocked={primaryLocked} setPrimaryLocked={setPrimaryLocked}
        secondaryLocked={secondaryLocked} setSecondaryLocked={setSecondaryLocked}
        THEMES={THEMES} theme={theme} setTheme={setTheme}
        generateRandomPair={generateRandomPair}
      />

      {/* Footer Link */}
      <div className="fixed bottom-3 right-4 lg:bottom-4 lg:right-6 text-[10px] sm:text-[11px] font-medium text-muted-foreground z-40 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/50 shadow-sm transition-opacity opacity-70 hover:opacity-100 hidden sm:flex items-center gap-1">
        Made with ❤️ by <a href="https://www.priyanshjolapara.com" target="_blank" rel="noreferrer" className="text-foreground hover:text-primary transition-colors underline decoration-border underline-offset-2">Priyansh Jolapara</a>
      </div>

      <Analytics />
    </div>
  );
}
