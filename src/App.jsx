import { useState, useEffect, useRef, useCallback } from 'react';
import { Moon, Sun, Check, Copy, RefreshCw, Download, Printer, ChevronDown, Keyboard } from 'lucide-react';
import TypeDock from './components/TypeDock';
import PreviewArea from './components/PreviewArea';
import RightTabs from './components/RightTabs';
import FontInfoPanel from './components/FontInfoPanel';
import Presence from './components/motion/Presence';
import Preloader from './components/Preloader';
import { TABS } from './data/constants';
import { FONTS, FONT_METADATA, fetchAllFonts } from './data/fonts';
import { SAMPLE } from './data/content';
import { loadFont, whenFontReady } from './lib/fontLoader';
import { fallbackFor } from './lib/typeStyles';
import { DUR } from './lib/gsap';
import { Switch } from "@/components/ui/switch";
import { Analytics } from "@vercel/analytics/react";

const SHORTCUTS = [
  { keys: ['Space'], label: 'Generate new pair' },
  { keys: ['L'], label: 'Lock / unlock primary font' },
  { keys: ['K'], label: 'Lock / unlock secondary font' },
  { keys: ['D'], label: 'Toggle dark mode' },
  { keys: ['1'], label: 'Focus preview' },
  { keys: ['2'], label: 'Article preview' },
  { keys: ['3'], label: 'Hero preview' },
  { keys: ['4'], label: 'Specimen preview' },
  { keys: ['?'], label: 'Show this shortcuts panel' },
  { keys: ['Esc'], label: 'Close any panel' },
];

export default function App() {
  const [isTuneOpen, setIsTuneOpen] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );
  const [activeTab, setActiveTab] = useState('focus');
  const [bodyLineHeight, setBodyLineHeight] = useState(1.7);

  const [primaryFont, setPrimaryFont] = useState('Plus Jakarta Sans');
  const [primaryLocked, setPrimaryLocked] = useState(false);
  const [primaryControls, setPrimaryControls] = useState({ size: 24, weight: 700, lh: 1.3, ls: 0 });

  const [secondaryFont, setSecondaryFont] = useState('Urbanist');
  const [secondaryLocked, setSecondaryLocked] = useState(false);
  const [secondaryControls, setSecondaryControls] = useState({ size: 16, weight: 400, lh: 1.7, ls: 0 });

  const [sampleText, setSampleText] = useState(SAMPLE.title);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [filteredFonts, setFilteredFonts] = useState(FONTS);

  const [infoFont, setInfoFont] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const exportRef = useRef(null);

  // Bumped on every generate so the preview replays its entrance animation.
  const [revealKey, setRevealKey] = useState(0);

  // Preloader gating: appReady reflects real asset load (font metadata +
  // the two starting webfonts); booted flips once the preloader's own
  // type-in animation has also finished, so the main tree never mounts
  // mid-typewriter even on a fast connection.
  const [appReady, setAppReady] = useState(false);
  const [booted, setBooted] = useState(false);
  const bootedRef = useRef(false);
  useEffect(() => { bootedRef.current = booted; }, [booted]);

  useEffect(() => {
    // Promise.allSettled — a rejected font load must never hang the
    // preloader forever. whenFontReady already carries its own timeout.
    Promise.allSettled([
      fetchAllFonts(),
      whenFontReady(primaryFont),
      whenFontReady(secondaryFont),
    ]).then(() => setAppReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  useEffect(() => {
    const handler = () => setShowShortcuts(true);
    window.addEventListener('jmt:showShortcuts', handler);
    return () => window.removeEventListener('jmt:showShortcuts', handler);
  }, []);

  const generateRandomPair = useCallback(() => {
    if (primaryLocked && secondaryLocked) return;

    const pool = (filteredFonts && filteredFonts.length > 1) ? filteredFonts : FONTS;

    let pf = primaryFont;
    let sf = secondaryFont;

    if (!primaryLocked && !secondaryLocked) {
      const pi = Math.floor(Math.random() * pool.length);
      let si;
      do { si = Math.floor(Math.random() * pool.length); } while (si === pi);
      pf = pool[pi];
      sf = pool[si];
    } else if (!primaryLocked) {
      const others = pool.filter(f => f !== secondaryFont);
      pf = others[Math.floor(Math.random() * others.length)] || pool[0];
    } else {
      const others = pool.filter(f => f !== primaryFont);
      sf = others[Math.floor(Math.random() * others.length)] || pool[0];
    }

    if (!primaryLocked && pf) { loadFont(pf); setPrimaryFont(pf); }
    if (!secondaryLocked && sf) { loadFont(sf); setSecondaryFont(sf); }
    setRevealKey(k => k + 1);
  }, [primaryLocked, secondaryLocked, primaryFont, secondaryFont, filteredFonts]);

  // ── Keyboard shortcuts ──────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!bootedRef.current) return;
      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const tabIndex = TABS.findIndex((_, i) => e.key === String(i + 1));
      if (tabIndex !== -1) { setActiveTab(TABS[tabIndex].id); return; }

      switch (e.key) {
        case ' ':
          // Only hijack Space when it isn't being used to scroll a panel.
          e.preventDefault();
          generateRandomPair();
          break;
        case 'l': case 'L': setPrimaryLocked(v => !v); break;
        case 'k': case 'K': setSecondaryLocked(v => !v); break;
        case 'd': case 'D': setIsDark(v => !v); break;
        case '?': setShowShortcuts(v => !v); break;
        case 'Escape':
          setShowShortcuts(false);
          setInfoFont(null);
          setExportOpen(false);
          setIsTuneOpen(false);
          break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [generateRandomPair]);

  // ── Copy CSS ────────────────────────────────────────
  const handleCopyCss = async () => {
    const weightsFor = (family, fallback) => {
      const w = FONT_METADATA.find(m => m.family === family)?.weights;
      return w?.length ? w.join(';') : fallback;
    };

    const encP = primaryFont.replace(/ /g, '+');
    const encS = secondaryFont.replace(/ /g, '+');

    const css = `/* JustMyType — Generated CSS */
@import url('https://fonts.googleapis.com/css2?family=${encP}:wght@${weightsFor(primaryFont, primaryControls.weight)}&family=${encS}:wght@${weightsFor(secondaryFont, secondaryControls.weight)}&display=swap');

.heading {
  font-family: '${primaryFont}', ${fallbackFor(primaryFont)};
  font-size: ${primaryControls.size}px;
  font-weight: ${primaryControls.weight};
  line-height: ${primaryControls.lh};
  letter-spacing: ${primaryControls.ls}em;
}

.body {
  font-family: '${secondaryFont}', ${fallbackFor(secondaryFont)};
  font-size: ${secondaryControls.size}px;
  font-weight: ${secondaryControls.weight};
  line-height: ${bodyLineHeight};
  letter-spacing: ${secondaryControls.ls}em;
}`;

    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fails on insecure origins — say so instead of flashing a false success.
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2600);
    }
  };

  // ── Export ──────────────────────────────────────────
  const handleExportPng = async () => {
    setExportOpen(false);
    setIsExporting(true);
    setExportError(null);
    try {
      const el = document.getElementById('jmt-preview-area');
      if (!el) throw new Error('Preview element not found');

      await document.fonts.ready;

      // ~40 KB that only matters once the user actually exports.
      const { toPng } = await import('html-to-image');

      const dataUrl = await toPng(el, {
        backgroundColor: isDark ? '#09090b' : '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        // Capture the full composition, not just the visible scroll window.
        width: el.scrollWidth,
        height: el.scrollHeight,
      });

      const link = document.createElement('a');
      link.download = `JustMyType_${primaryFont.replace(/\s/g, '-')}_x_${secondaryFont.replace(/\s/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      setExportError(err.message || 'Export failed');
      setTimeout(() => setExportError(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    setExportOpen(false);
    window.print();
  };

  return (
    <>
      {!booted && <Preloader ready={appReady} onFinish={() => setBooted(true)} />}
      {booted && (
      <div className="w-screen min-h-[100dvh] lg:h-screen flex flex-col lg:flex-row bg-background overflow-y-auto overflow-x-hidden lg:overflow-hidden relative font-sans text-foreground">

        <FontInfoPanel font={infoFont} onClose={() => setInfoFont(null)} />

        {/* Keyboard shortcuts */}
        <Presence
          show={showShortcuts}
          from={{ opacity: 0 }} to={{ opacity: 1 }} exit={{ opacity: 0 }}
          duration={DUR.fast}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          onClick={() => setShowShortcuts(false)}
        />
        <Presence
          show={showShortcuts}
          from={{ opacity: 0, scale: 0.95, y: 20 }}
          to={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          duration={DUR.base}
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
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
                    <kbd key={k} className="text-[11px] px-2 py-0.5 bg-muted border border-border rounded-md font-mono text-foreground min-w-[28px] text-center">
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Presence>

        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-end px-3 sm:px-4 py-3 bg-background border-b border-border z-40 shrink-0">
          <div className="flex items-center gap-1.5 z-50 bg-background/90 backdrop-blur border border-border rounded-full p-1 shadow-sm shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full">
              <Sun size={14} className={!isDark ? 'text-foreground' : 'text-muted-foreground'} />
              <Switch checked={isDark} onCheckedChange={setIsDark} aria-label="Dark mode" className="scale-[0.85] origin-center -mx-0.5" />
              <Moon size={14} className={isDark ? 'text-foreground' : 'text-muted-foreground'} />
            </div>
          </div>
        </header>

        {/* Mobile tab bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-background/90 backdrop-blur-md border-t border-border z-40 px-2 py-2">
          <div className="flex items-center justify-center gap-1 overflow-x-auto scrollbar-hide max-w-md mx-auto">
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-colors ${isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted/50'}`}
                >
                  <Icon size={18} />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Desktop floating actions */}
        <div className="hidden lg:flex absolute top-6 right-8 items-center gap-3 z-50">
          <button
            className={`flex items-center gap-2 bg-background/80 backdrop-blur border px-4 py-2.5 rounded-full text-[13px] font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 ${
              copied ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
                : copyError ? 'text-destructive border-destructive/30'
                : 'text-foreground border-border hover:bg-card'
            }`}
            onClick={handleCopyCss}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : copyError ? 'Copy failed' : 'Copy CSS'}</span>
          </button>

          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(v => !v)}
              disabled={isExporting}
              aria-expanded={exportOpen}
              className="flex items-center gap-2 bg-background/80 backdrop-blur border border-border px-4 py-2.5 rounded-full text-[13px] font-semibold text-foreground shadow-sm transition-all hover:bg-card hover:scale-105 active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
            >
              {isExporting
                ? <RefreshCw size={16} className="animate-spin" />
                : <Download size={16} />}
              <span>{isExporting ? 'Exporting…' : 'Export'}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${exportOpen ? 'rotate-180' : ''}`} />
            </button>

            <Presence
              show={exportOpen}
              from={{ opacity: 0, y: 6, scale: 0.97 }}
              to={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              duration={DUR.fast}
              className="absolute right-0 top-[calc(100%+8px)] w-48 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50 origin-top-right"
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
            </Presence>
          </div>

          <div className="flex items-center gap-2 bg-background/80 backdrop-blur border border-border px-3 py-2.5 rounded-full shadow-sm">
            <Sun size={16} className={!isDark ? 'text-foreground' : 'text-muted-foreground'} />
            <Switch checked={isDark} onCheckedChange={setIsDark} aria-label="Dark mode" />
            <Moon size={16} className={isDark ? 'text-foreground' : 'text-muted-foreground'} />
          </div>
        </div>

        {/* Export error toast — replaces the old alert() */}
        <Presence
          show={!!exportError}
          from={{ opacity: 0, y: 16 }} to={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
          duration={DUR.fast}
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-destructive text-destructive-foreground text-[13px] font-medium px-4 py-2.5 rounded-xl shadow-lg"
        >
          {exportError}
        </Presence>

        <TypeDock
          sampleText={sampleText} setSampleText={setSampleText}
          primaryFont={primaryFont} setPrimaryFont={setPrimaryFont}
          secondaryFont={secondaryFont} setSecondaryFont={setSecondaryFont}
          pControls={primaryControls} setPControls={setPrimaryControls}
          sControls={secondaryControls} setSControls={setSecondaryControls}
          primaryLocked={primaryLocked} setPrimaryLocked={setPrimaryLocked}
          secondaryLocked={secondaryLocked} setSecondaryLocked={setSecondaryLocked}
          fontList={FONTS}
          bodyLineHeight={bodyLineHeight} setBodyLineHeight={setBodyLineHeight}
          onFilteredListChange={setFilteredFonts}
          isTuneOpen={isTuneOpen} setIsTuneOpen={setIsTuneOpen}
          onShowFontInfo={setInfoFont}
          generateRandomPair={generateRandomPair}
        />

        <PreviewArea
          activeTab={activeTab}
          primaryFont={primaryFont} pControls={primaryControls}
          secondaryFont={secondaryFont} sControls={secondaryControls}
          sampleText={sampleText}
          bodyLineHeight={bodyLineHeight}
          revealKey={revealKey}
        />

        <RightTabs
          activeTab={activeTab} setActiveTab={setActiveTab}
        />

        <div className="fixed bottom-3 right-4 lg:bottom-4 lg:right-6 text-[10px] sm:text-[11px] font-medium text-muted-foreground z-40 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/50 shadow-sm transition-opacity opacity-70 hover:opacity-100 hidden sm:flex items-center gap-1">
          Made with ❤️ by <a href="https://www.priyanshjolapara.com" target="_blank" rel="noreferrer" className="text-foreground hover:text-primary transition-colors underline decoration-border underline-offset-2">Priyansh Jolapara</a>
        </div>

        <Analytics />
      </div>
      )}
    </>
  );
}
