import { useState, useEffect, useRef, useCallback } from 'react';
import { Moon, Sun, Check, Copy, Keyboard, Info, Link2 } from 'lucide-react';
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
import { buildShareUrl, readShareState } from './lib/shareLink';
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";

const SHORTCUTS = [
  { keys: ['Space'], label: 'Generate new pair (next candidate in Compare)' },
  { keys: ['L'], label: 'Lock / unlock primary font' },
  { keys: ['K'], label: 'Lock / unlock secondary font' },
  { keys: ['D'], label: 'Toggle dark mode' },
  { keys: ['1'], label: 'Focus preview' },
  { keys: ['2'], label: 'Article preview' },
  { keys: ['3'], label: 'Hero preview' },
  { keys: ['4'], label: 'Specimen preview' },
  { keys: ['5'], label: 'Compare preview' },
  { keys: ['?'], label: 'Show this shortcuts panel' },
  { keys: ['Esc'], label: 'Close any panel' },
];

// A compact icon circle for the desktop toolbar that grows rightward on
// hover (or keyboard focus) to reveal a label, rather than a floating
// tooltip — same technique RightTabs already uses for its preview-mode
// pill: the label span sits collapsed at max-w-0/opacity-0 and expands in
// place, so the button's own edge is what moves instead of something
// appearing separately above or below it.
const ToolbarIconButton = ({ label, className, icon, ...props }) => (
  <button
    className={cn(
      "group flex items-center h-9 bg-background/80 backdrop-blur border border-border rounded-full text-foreground shadow-sm transition-all duration-200 hover:bg-card active:scale-95",
      className
    )}
    {...props}
  >
    <span className="shrink-0 w-9 h-9 flex items-center justify-center">{icon}</span>
    <span
      className={cn(
        "text-[13px] font-medium min-w-0 whitespace-nowrap overflow-hidden",
        "max-w-0 opacity-0 pr-0",
        "transition-[max-width,opacity,padding] duration-300 ease-out",
        "group-hover:max-w-[160px] group-hover:opacity-100 group-hover:pr-3.5",
        "group-focus-visible:max-w-[160px] group-focus-visible:opacity-100 group-focus-visible:pr-3.5"
      )}
    >
      {label}
    </span>
  </button>
);

export default function App() {
  // Read once per mount — a shared link's pairing/controls become the
  // starting state instead of the hardcoded defaults below, wherever it
  // specifies them. Recomputing on every render is harmless (it's just a
  // query-string parse), and only the state initializers below — which
  // React only ever calls once — actually consume the result.
  const shared = readShareState();

  const [isTuneOpen, setIsTuneOpen] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );
  const [activeTab, setActiveTab] = useState(() => shared?.activeTab ?? 'focus');
  const [bodyLineHeight, setBodyLineHeight] = useState(() => shared?.bodyLineHeight ?? 1.7);

  const [primaryFont, setPrimaryFont] = useState(() => shared?.primaryFont ?? 'Plus Jakarta Sans');
  const [primaryLocked, setPrimaryLocked] = useState(false);
  const [primaryControls, setPrimaryControls] = useState(() => shared?.primaryControls ?? { size: 24, weight: 700, lh: 1.3, ls: 0 });

  const [secondaryFont, setSecondaryFont] = useState(() => shared?.secondaryFont ?? 'Urbanist');
  const [secondaryLocked, setSecondaryLocked] = useState(false);
  const [secondaryControls, setSecondaryControls] = useState(() => shared?.secondaryControls ?? { size: 16, weight: 400, lh: 1.7, ls: 0 });

  const [sampleText, setSampleText] = useState(() => shared?.sampleText ?? SAMPLE.title);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkCopyError, setLinkCopyError] = useState(false);
  const [filteredFonts, setFilteredFonts] = useState(FONTS);

  const [infoFont, setInfoFont] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [infoMenuOpen, setInfoMenuOpen] = useState(false);
  const infoRef = useRef(null);

  const [fontToast, setFontToast] = useState(null);
  const handleFontAdded = (family) => {
    setFontToast(`${family} added and set as Primary`);
    setTimeout(() => setFontToast(null), 4000);
  };

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

  // The ?s= param has done its job feeding the state initializers above —
  // clear it so the address bar doesn't keep showing a link that no longer
  // matches what's on screen the moment something changes, and so the
  // Share button always builds a fresh one from current state rather than
  // someone re-sharing whatever they were sent.
  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
  }, []);

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
    if (!infoMenuOpen) return;
    const handler = (e) => {
      if (infoRef.current && !infoRef.current.contains(e.target)) setInfoMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [infoMenuOpen]);

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
          // In Compare, Space cycles candidate fonts instead — that view
          // owns its own Space listener while it's mounted.
          if (activeTab === 'compare') break;
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
          setIsTuneOpen(false);
          setInfoMenuOpen(false);
          break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [generateRandomPair, activeTab]);

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

  // ── Share link ──────────────────────────────────────
  const handleCopyShareLink = async () => {
    const url = buildShareUrl({
      primaryFont, primaryControls,
      secondaryFont, secondaryControls,
      bodyLineHeight, sampleText, activeTab,
    });
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setLinkCopyError(true);
      setTimeout(() => setLinkCopyError(false), 2600);
    }
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
        <header className="lg:hidden flex items-center justify-end gap-2 px-3 sm:px-4 py-3 bg-background border-b border-border z-40 shrink-0">
          <button
            onClick={handleCopyShareLink}
            aria-label="Copy a link to this exact pairing"
            className={`flex items-center justify-center w-9 h-9 rounded-full border shadow-sm transition-colors shrink-0 ${
              linkCopied ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
                : linkCopyError ? 'text-destructive border-destructive/30'
                : 'bg-background/90 backdrop-blur text-foreground border-border'
            }`}
          >
            {linkCopied ? <Check size={15} /> : <Link2 size={15} />}
          </button>

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
          {/* Font details — one button for two fonts, so it picks which. */}
          <div className="relative" ref={infoRef}>
            <ToolbarIconButton
              onClick={() => setInfoMenuOpen(v => !v)}
              aria-expanded={infoMenuOpen}
              aria-label="Font details"
              label="Font details"
              icon={<Info size={15} />}
            />

            <Presence
              show={infoMenuOpen}
              from={{ opacity: 0, y: 6, scale: 0.97 }}
              to={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              duration={DUR.fast}
              className="absolute right-0 top-[calc(100%+8px)] w-56 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50 origin-top-right"
            >
              {[
                { role: 'Primary', font: primaryFont },
                { role: 'Secondary', font: secondaryFont },
              ].map(({ role, font }) => (
                <button
                  key={role}
                  onClick={() => { setInfoFont(font); setInfoMenuOpen(false); }}
                  className="w-full flex flex-col items-start gap-0.5 px-4 py-2.5 hover:bg-muted transition-colors text-left"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{role}</span>
                  <span className="text-[13px] font-medium text-foreground truncate max-w-full">{font}</span>
                </button>
              ))}
            </Presence>
          </div>

          <ToolbarIconButton
            onClick={handleCopyCss}
            aria-label={copied ? 'Copied!' : copyError ? 'Copy failed' : 'Copy CSS'}
            label={copied ? 'Copied!' : copyError ? 'Copy failed' : 'Copy CSS'}
            icon={copied ? <Check size={15} /> : <Copy size={15} />}
            className={
              copied ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
                : copyError ? 'text-destructive border-destructive/30'
                : undefined
            }
          />

          <ToolbarIconButton
            onClick={handleCopyShareLink}
            aria-label={linkCopied ? 'Copied!' : linkCopyError ? 'Copy failed' : 'Share — copy a link to this exact pairing'}
            label={linkCopied ? 'Copied!' : linkCopyError ? 'Copy failed' : 'Share'}
            icon={linkCopied ? <Check size={15} /> : <Link2 size={15} />}
            className={
              linkCopied ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
                : linkCopyError ? 'text-destructive border-destructive/30'
                : undefined
            }
          />

          <ToolbarIconButton
            onClick={() => setIsDark(v => !v)}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            label={isDark ? 'Switch to light' : 'Switch to dark'}
            icon={isDark ? <Moon size={15} /> : <Sun size={15} />}
          />
        </div>

        {/* Custom font added — confirms the drop/upload worked and where
            to find it, since it doesn't auto-assign to either slot. */}
        <Presence
          show={!!fontToast}
          from={{ opacity: 0, y: -16 }} to={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          duration={DUR.fast}
          role="status"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[80] bg-primary text-primary-foreground text-[13px] font-medium px-4 py-2.5 rounded-xl shadow-lg"
        >
          {fontToast}
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
          generateRandomPair={generateRandomPair}
          onFontAdded={handleFontAdded}
        />

        <PreviewArea
          activeTab={activeTab}
          primaryFont={primaryFont} pControls={primaryControls}
          secondaryFont={secondaryFont} sControls={secondaryControls}
          sampleText={sampleText} setSampleText={setSampleText}
          bodyLineHeight={bodyLineHeight}
          revealKey={revealKey}
        />

        <RightTabs
          activeTab={activeTab} setActiveTab={setActiveTab}
        />

        {/* Plain line, no pill — this is a credit, not a control. */}
        <div className="fixed bottom-3 right-4 lg:bottom-5 lg:right-6 text-[10px] sm:text-[11px] font-medium text-muted-foreground/70 z-40 transition-opacity hover:opacity-100 hidden sm:flex items-center gap-1">
          Onboarded by <a href="https://www.priyanshjolapara.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Priyansh</a>
        </div>

        <Analytics />
      </div>
      )}
    </>
  );
}
