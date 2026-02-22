import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Check, Copy } from 'lucide-react';
import Sidebar from './components/Sidebar';
import PreviewArea from './components/PreviewArea';
import RightTabs from './components/RightTabs';
import { FONTS } from './data/fonts';
import { SAMPLE } from './data/content';

import { Switch } from "@/components/ui/switch";

const THEMES = [
  { name: 'blue', color: '#3b82f6', hex: 'bg-blue-500' },
  { name: 'zinc', color: '#18181b', hex: 'bg-zinc-900 dark:bg-zinc-100' },
  { name: 'rose', color: '#e11d48', hex: 'bg-rose-500' },
  { name: 'green', color: '#16a34a', hex: 'bg-green-600' },
  { name: 'orange', color: '#f97316', hex: 'bg-orange-500' },
];

export default function App() {
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
    <div className="w-screen h-screen flex bg-background overflow-hidden relative font-sans text-foreground">
      {/* Floating Actions */}
      <div className="absolute top-6 right-8 flex items-center gap-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 bg-background/80 backdrop-blur border border-border px-4 py-2.5 rounded-full text-[13px] font-semibold text-foreground shadow-sm transition-colors hover:bg-card ${copied ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}`}
          onClick={handleCopyCss}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy CSS'}
        </motion.button>

        {/* Dark Mode Toggle */}
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur border border-border px-3 py-2.5 rounded-full shadow-sm">
          <Sun size={14} className={!isDark ? 'text-foreground' : 'text-muted-foreground'} />
          <Switch
            checked={isDark}
            onCheckedChange={setIsDark}
          />
          <Moon size={14} className={isDark ? 'text-foreground' : 'text-muted-foreground'} />
        </div>
      </div>

      <Sidebar
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
      />
    </div>
  );
}
