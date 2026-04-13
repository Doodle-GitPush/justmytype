import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Check, Copy, RefreshCw, PanelLeft, Download, Printer, ChevronDown, Keyboard } from 'lucide-react';
import html2canvas from 'html2canvas';
import Sidebar from './components/Sidebar';
import PreviewArea from './components/PreviewArea';
import RightTabs from './components/RightTabs';
import FontInfoPanel from './components/FontInfoPanel';
import { TABS } from './data/constants';
import { FONTS, fetchAllFonts } from './data/fonts';
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

const SHORTCUTS = [
  { keys: ['Space'], label: 'Generate new pair' },
  { keys: ['L'], label: 'Lock / unlock primary font' },
  { keys: ['K'], label: 'Lock / unlock secondary font' },
  { keys: ['D'], label: 'Toggle dark mode' },
  { keys: ['1'], label: 'Article preview' },
  { keys: ['2'], label: 'Hero preview' },
  { keys: ['3'], label: 'Cards preview' },
  { keys: ['4'], label: 'Specimen preview' },
  { keys: ['?'], label: 'Show this shortcuts panel' },
  { keys: ['Esc'], label: 'Close any panel' },
];

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [theme, setTheme] = useState('blue');
  const [activeTab, setActiveTab] = useState('article');
  const [lineWidth, setLineWidth] = useState(72);

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
  const [fontListLength, setFontListLength] = useState(FONTS.length);

  // Font Info Panel
  const [infoFont, setInfoFont] = useState(null);

  // Shortcuts overlay
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Export dropdown
  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef(null);

  // Fetch full fonts library
  useEffect(() => {
    fetchAllFonts().then(list => setFontListLength(list.length));
  }, []);

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

    THEMES.forEach(t => root.classList.remove(`theme-${t.name}`));
    if (theme !== 'blue') {
      root.classList.add(`theme-${theme}`);
    }
  }, [isDark, theme]);

  // Close export dropdown on outside click
  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  // Listen for the shortcuts event from RightTabs
  useEffect(() => {
    const handler = () => setShowShortcuts(true);
    window.addEventListener('jmt:showShortcuts', handler);
    return () => window.removeEventListener('jmt:showShortcuts', handler);
  }, []);

  const generateRandomPair = useCallback(() => {
    if (primaryLocked && secondaryLocked) return;

    let pi = FONTS.indexOf(primaryFont);
    let si = FONTS.indexOf(secondaryFont);

    if (!primaryLocked && !secondaryLocked) {
      pi = Math.floor(Math.random() * fontListLength);
      do { si = Math.floor(Math.random() * fontListLength); } while (si === pi);
    } else if (!primaryLocked) {
      do { pi = Math.floor(Math.random() * fontListLength); } while (pi === si);
    } else {
      do { si = Math.floor(Math.random() * fontListLength); } while (si === pi);
    }

    if (!primaryLocked && FONTS[pi]) setPrimaryFont(FONTS[pi]);
    if (!secondaryLocked && FONTS[si]) setSecondaryFont(FONTS[si]);
  }, [primaryLocked, secondaryLocked, primaryFont, secondaryFont, fontListLength]);

  // ──────────────────────────────────────────────
  // Keyboard Shortcuts
  // ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      // Suppress when typing in an input or textarea
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          generateRandomPair();
          break;
        case 'l':
        case 'L':
          setPrimaryLocked(v => !v);
          break;
        case 'k':
        case 'K':
          setSecondaryLocked(v => !v);
          break;
        case 'd':
        case 'D':
          setIsDark(v => !v);
          break;
        case '1': setActiveTab(TABS[0].id); break;
        case '2': setActiveTab(TABS[1].id); break;
        case '3': setActiveTab(TABS[2].id); break;
        case '4': setActiveTab(TABS[3].id); break;
        case '?':
          setShowShortcuts(v => !v);
          break;
        case 'Escape':
          setShowShortcuts(false);
          setInfoFont(null);
          setExportOpen(false);
          break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [generateRandomPair]);

  // ──────────────────────────────────────────────
  // Copy CSS
  // ──────────────────────────────────────────────
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
  max-width: ${lineWidth >= 100 ? '100%' : `${lineWidth}ch`};
}`;
    navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ──────────────────────────────────────────────
  // Export as PNG
  // ──────────────────────────────────────────────
  const handleExportPng = async () => {
    setExportOpen(false);
    setIsExporting(true);
    try {
      const el = document.getElementById('jmt-preview-area');
      if (!el) return;
      const canvas = await html2canvas(el, {
        backgroundColor: isDark ? '#09090b' : '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `JustMyType_${primaryFont.replace(/\s/g, '-')}_x_${secondaryFont.replace(/\s/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // ──────────────────────────────────────────────
  // Print
  // ──────────────────────────────────────────────
  const handlePrint = () => {
    setExportOpen(false);
    window.print();
  };

  return (
    <div className="w-screen min-h-[100dvh] lg:h-screen flex flex-col lg:flex-row bg-background overflow-y-auto overflow-x-hidden lg:overflow-hidden relative font-sans text-foreground">

      {/* Font Info Panel */}
      <FontInfoPanel font={infoFont} onClose={() => setInfoFont(null)} />

      {/* Keyboard Shortcuts Overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <>
            <motion.div
              key="sc-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              onClick={() => setShowShortcuts(false)}
            />
            <motion.div
              key="sc-panel"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[400px] max-w-[90vw] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Keyboard size={16} className="text-primary" />
                  <span className="font-semibold text-foreground text-[15px]">Keyboard Shortcuts</span>
                </div>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="text-[11px] px-2.5 py-1 bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors font-mono"
                >
                  Esc
                </button>
              </div>
              <div className="p-5 flex flex-col gap-2">
                {SHORTCUTS.map(({ keys, label }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">{label}</span>
                    <div className="flex items-center gap-1">
                      {keys.map(k => (
                        <kbd
                          key={k}
                          className="text-[11px] px-2 py-0.5 bg-muted border border-border rounded-md font-mono text-foreground min-w-[28px] text-center"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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

      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-3 sm:px-4 py-3 bg-background border-b border-border z-40 shrink-0">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="w-11 h-11 bg-background/80 backdrop-blur border border-border text-foreground rounded-full shadow-sm flex items-center justify-center hover:bg-muted transition-all shrink-0"
        >
          <span className="font-serif italic text-lg font-bold mt-0.5">Aa</span>
        </button>

        <div className="flex items-center gap-1.5 z-50 bg-background/90 backdrop-blur border border-border rounded-full p-1 shadow-sm shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-1.5 bg-transparent px-3 py-1.5 rounded-full text-[12px] font-semibold text-foreground transition-colors hover:bg-muted ${copied ? 'text-emerald-600' : ''}`}
            onClick={handleCopyCss}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </motion.button>

          <div className="w-px h-3.5 bg-border mx-0.5"></div>

          <div className="flex items-center gap-1.5 bg-transparent px-2 py-1.5 rounded-full">
            <Sun size={14} className={!isDark ? 'text-foreground' : 'text-muted-foreground'} />
            <Switch
              checked={isDark}
              onCheckedChange={setIsDark}
              className="scale-[0.85] origin-center -mx-0.5"
            />
            <Moon size={14} className={isDark ? 'text-foreground' : 'text-muted-foreground'} />
          </div>
        </div>
      </header>

      {/* Mobile FAB for Generate */}
      <button
        onClick={generateRandomPair}
        className="lg:hidden fixed bottom-[90px] right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-[0_8px_30px_rgba(var(--primary),0.3)] border border-primary/20 flex items-center justify-center z-30 hover:scale-105 active:scale-95 transition-transform"
      >
        <RefreshCw size={24} />
      </button>

      {/* Mobile Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-background/90 backdrop-blur-md border-t border-border z-40 px-2 py-2">
        <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide max-w-md mx-auto">
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
        </div>
      </nav>

      {/* Floating Actions (Desktop Only) */}
      <div className="hidden lg:flex absolute top-6 right-8 items-center gap-3 z-50">
        {/* Copy CSS */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 bg-background/80 backdrop-blur border border-border px-4 py-2.5 rounded-full text-[13px] font-semibold text-foreground shadow-sm transition-colors hover:bg-card ${copied ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : ''}`}
          onClick={handleCopyCss}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? 'Copied!' : 'Copy CSS'}</span>
        </motion.button>

        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setExportOpen(v => !v)}
            disabled={isExporting}
            className="flex items-center gap-2 bg-background/80 backdrop-blur border border-border px-4 py-2.5 rounded-full text-[13px] font-semibold text-foreground shadow-sm transition-colors hover:bg-card disabled:opacity-60"
          >
            {isExporting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <RefreshCw size={16} />
              </motion.div>
            ) : (
              <Download size={16} />
            )}
            <span>{isExporting ? 'Exporting…' : 'Export'}</span>
            <ChevronDown size={13} className={`transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {exportOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-[calc(100%+8px)] w-48 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50"
              >
                <button
                  onClick={handleExportPng}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-foreground hover:bg-muted transition-colors text-left"
                >
                  <Download size={14} className="text-muted-foreground shrink-0" />
                  <div>
                    <div className="font-medium">Export as PNG</div>
                    <div className="text-[11px] text-muted-foreground">2× high-res image</div>
                  </div>
                </button>
                <div className="h-px bg-border mx-3" />
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-foreground hover:bg-muted transition-colors text-left"
                >
                  <Printer size={14} className="text-muted-foreground shrink-0" />
                  <div>
                    <div className="font-medium">Print / Save PDF</div>
                    <div className="text-[11px] text-muted-foreground">Clean print layout</div>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur border border-border px-3 py-2.5 rounded-full shadow-sm">
          <Sun size={16} className={!isDark ? 'text-foreground' : 'text-muted-foreground'} />
          <Switch
            checked={isDark}
            onCheckedChange={setIsDark}
          />
          <Moon size={16} className={isDark ? 'text-foreground' : 'text-muted-foreground'} />
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
        fontList={FONTS}
        lineWidth={lineWidth} setLineWidth={setLineWidth}
      />

      <PreviewArea
        activeTab={activeTab}
        primaryFont={primaryFont} pControls={primaryControls}
        secondaryFont={secondaryFont} sControls={secondaryControls}
        sampleText={sampleText}
        lineWidth={lineWidth}
      />

      <RightTabs
        activeTab={activeTab} setActiveTab={setActiveTab}
        primaryFont={primaryFont} secondaryFont={secondaryFont}
        primaryLocked={primaryLocked} setPrimaryLocked={setPrimaryLocked}
        secondaryLocked={secondaryLocked} setSecondaryLocked={setSecondaryLocked}
        THEMES={THEMES} theme={theme} setTheme={setTheme}
        generateRandomPair={generateRandomPair}
        onShowFontInfo={setInfoFont}
      />

      {/* Footer Link */}
      <div className="fixed bottom-3 right-4 lg:bottom-4 lg:right-6 text-[10px] sm:text-[11px] font-medium text-muted-foreground z-40 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/50 shadow-sm transition-opacity opacity-70 hover:opacity-100 hidden sm:flex items-center gap-1">
        Made with ❤️ by <a href="https://www.priyanshjolapara.com" target="_blank" rel="noreferrer" className="text-foreground hover:text-primary transition-colors underline decoration-border underline-offset-2">Priyansh Jolapara</a>
      </div>

      <Analytics />
    </div>
  );
}
