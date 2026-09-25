import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Moon, Sun, Check, Copy, Keyboard, Info, Link2, Trophy } from 'lucide-react';
import TypeDock from './components/TypeDock';
import PreviewArea from './components/PreviewArea';
import ViewMenu from './components/ViewMenu';
import FontInfoPanel from './components/FontInfoPanel';
import AchievementsPanel from './components/AchievementsPanel';
import Presence from './components/motion/Presence';
import Preloader from './components/Preloader';
import { TABS } from './data/constants';
import { FONTS, fetchAllFonts } from './data/fonts';
import { SAMPLE } from './data/content';
import { loadFont, whenFontReady, familyQuery } from './lib/fontLoader';
import { fallbackFor, fxStyle } from './lib/typeStyles';
import { track, onUnlock } from './lib/achievements';
import { DUR } from './lib/gsap';
import { buildShareUrl, readShareState } from './lib/shareLink';
import { generatePair, headingWeight, bodyWeight } from './lib/pairing';
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";

// Studios and games only load when opened — they're most of the code and
// none of the first paint.
const AnimateStudio = lazy(() => import('./components/AnimateStudio'));
const PosterStudio = lazy(() => import('./components/PosterStudio'));
const LabStudio = lazy(() => import('./components/LabStudio'));
const KernGame = lazy(() => import('./components/KernGame'));
const MatchGame = lazy(() => import('./components/MatchGame'));

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
  { keys: ['6'], label: 'Realistic layouts' },
  { keys: ['7'], label: 'Glyph explorer' },
  { keys: ['?'], label: 'Show this shortcuts panel' },
  { keys: ['Esc'], label: 'Close any panel' },
];

// A compact icon circle for the desktop toolbar that grows rightward on
// hover (or keyboard focus) to reveal a label, rather than a floating
// tooltip — same idea the old preview-mode pill used,
// but that one animates max-width, which looks snappy rather than smooth:
// the box reaches its actual content width the moment max-width crosses
// it, then sits idle for whatever's left of the transition, so it visibly
// front-loads instead of moving at a constant rate. A grid track animating
// from 0fr to 1fr doesn't have that ceiling — its width tracks the eased
// curve for the whole duration, the same trick TypeDock's Tune drawer
// already uses for its height reveal. The label itself also slides and
// fades in on its own faster beat, so the reveal reads as two things
// happening (the pill growing, the word arriving) rather than one flat
// width change.
const ToolbarIconButton = ({ label, className, icon, ...props }) => (
  <button
    className={cn(
      "group flex items-center h-9 bg-background/80 backdrop-blur border border-border rounded-full text-foreground shadow-sm transition-colors duration-200 hover:bg-card active:scale-95",
      className
    )}
    {...props}
  >
    <span className="shrink-0 w-9 h-9 flex items-center justify-center">{icon}</span>
    <span
      className={cn(
        "grid grid-cols-[0fr] group-hover:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr]",
        "transition-[grid-template-columns] duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      )}
    >
      <span className="overflow-hidden min-w-0">
        <span
          className={cn(
            "block text-[13px] font-medium whitespace-nowrap pl-0.5 pr-3.5",
            "opacity-0 -translate-x-1 transition-[opacity,transform] duration-200 ease-out",
            "group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0"
          )}
        >
          {label}
        </span>
      </span>
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
  // Studios and games are full takeovers, not overlays — entering one
  // replaces the whole editor shell; Back is its own explicit control.
  // null | 'animate' | 'poster' | 'lab' | 'kern' | 'match'
  const [studio, setStudio] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [unlockToast, setUnlockToast] = useState(null);

  // Celebrate each achievement the moment it unlocks.
  // Unlocks queue up and are celebrated one at a time — and never over the
  // preloader (dark mode unlocks "Night Owl" the instant the app mounts).
  const [unlockQueue, setUnlockQueue] = useState([]);
  useEffect(() => onUnlock((a) => setUnlockQueue((q) => [...q, a])), []);

  const openStudio = (id) => {
    if (id === 'achievements') setShowAchievements(true);
    else setStudio(id);
  };

  // Type Match's "Use pair" — straight into the editor with sensible weights.
  const applyPair = (heading, body) => {
    loadFont(heading);
    loadFont(body);
    setPrimaryFont(heading);
    setSecondaryFont(body);
    setPrimaryControls(c => ({ ...c, weight: headingWeight(heading) }));
    setSecondaryControls(c => ({ ...c, weight: bodyWeight(body) }));
    setStudio(null);
    setRevealKey(k => k + 1);
  };
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

  // Which kind of pairing Generate aims for — remembered between visits.
  const [mood, setMood] = useState(() => {
    try { return localStorage.getItem('jmt:mood') || 'any'; } catch { return 'any'; }
  });
  useEffect(() => {
    try { localStorage.setItem('jmt:mood', mood); } catch { /* storage unavailable */ }
  }, [mood]);
  // Why the generator chose the current pair, shown under the font pills.
  const [pairReason, setPairReason] = useState(null);

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
    if (!booted || unlockToast || !unlockQueue.length) return;
    const [a, ...rest] = unlockQueue;
    // Deferred a tick so the state updates land outside the effect body.
    const show = setTimeout(() => {
      setUnlockQueue(rest);
      setUnlockToast(a);
      if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        import('canvas-confetti').then(({ default: confetti }) =>
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.15 }, zIndex: 200 })
        );
      }
    }, 400);
    return () => clearTimeout(show);
  }, [booted, unlockToast, unlockQueue]);

  useEffect(() => {
    if (!unlockToast) return;
    const hide = setTimeout(() => setUnlockToast(null), 4200);
    return () => clearTimeout(hide);
  }, [unlockToast]);

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
    if (isDark) track('dark');
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
    const { heading, body, reason } = generatePair({
      pool,
      mood,
      lockedHeading: primaryLocked ? primaryFont : undefined,
      lockedBody: secondaryLocked ? secondaryFont : undefined,
    });

    // A generated pair also lands on sensible weights — a bold-ish heading
    // and a regular body — rather than whatever the previous pair was left
    // on, which the new family may not even ship.
    if (!primaryLocked && heading) {
      loadFont(heading);
      setPrimaryFont(heading);
      setPrimaryControls(c => ({ ...c, weight: headingWeight(heading) }));
    }
    if (!secondaryLocked && body) {
      loadFont(body);
      setSecondaryFont(body);
      setSecondaryControls(c => ({ ...c, weight: bodyWeight(body) }));
    }
    setPairReason(reason);
    setRevealKey(k => k + 1);
    track('generate', { fonts: [heading, body], mood });
  }, [primaryLocked, secondaryLocked, primaryFont, secondaryFont, filteredFonts, mood]);

  // ── Keyboard shortcuts ──────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!bootedRef.current) return;
      // Studios own the keyboard while they're open.
      if (studio) return;
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
  }, [generateRandomPair, activeTab, studio]);

  // ── Copy CSS ────────────────────────────────────────
  const handleCopyCss = async () => {
    const rule = (selector, family, c, lh) => {
      const fx = fxStyle(family, c);
      return [
        `${selector} {`,
        `  font-family: '${family}', ${fallbackFor(family)};`,
        `  font-size: ${c.size}px;`,
        `  font-weight: ${c.weight};`,
        `  line-height: ${lh};`,
        `  letter-spacing: ${c.ls}em;`,
        fx.fontVariationSettings && `  font-variation-settings: ${fx.fontVariationSettings};`,
        fx.fontFeatureSettings && `  font-feature-settings: ${fx.fontFeatureSettings};`,
        '}',
      ].filter(Boolean).join('\n');
    };

    const css = `/* JustMyType — Generated CSS */
@import url('https://fonts.googleapis.com/css2?${familyQuery(primaryFont)}&${familyQuery(secondaryFont)}&display=swap');

${rule('.heading', primaryFont, primaryControls, primaryControls.lh)}

${rule('.body', secondaryFont, secondaryControls, bodyLineHeight)}`;

    try {
      await navigator.clipboard.writeText(css);
      track('css');
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
      track('share');
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

      {/* A studio replaces the whole editor shell below rather than
          overlaying it — the dock, preview tabs, and toolbar all disappear
          while it's up, and Back is the only way out. */}
      <Suspense fallback={<div className="fixed inset-0 z-[90] bg-background" />}>
        {booted && studio === 'animate' && (
          <AnimateStudio
            primaryFont={primaryFont}
            pControls={primaryControls}
            secondaryFont={secondaryFont}
            sControls={secondaryControls}
            text={sampleText || SAMPLE.title}
            onExit={() => setStudio(null)}
          />
        )}
        {booted && studio === 'poster' && (
          <PosterStudio
            primaryFont={primaryFont}
            pControls={primaryControls}
            secondaryFont={secondaryFont}
            sControls={secondaryControls}
            text={sampleText || SAMPLE.title}
            onExit={() => setStudio(null)}
          />
        )}
        {booted && studio === 'lab' && (
          <LabStudio
            primaryFont={primaryFont}
            pControls={primaryControls}
            secondaryFont={secondaryFont}
            sControls={secondaryControls}
            text={sampleText || SAMPLE.title}
            onExit={() => setStudio(null)}
          />
        )}
        {booted && studio === 'kern' && <KernGame onExit={() => setStudio(null)} />}
        {booted && studio === 'match' && <MatchGame onExit={() => setStudio(null)} onApply={applyPair} />}
      </Suspense>

      <AchievementsPanel open={showAchievements} onOpenChange={setShowAchievements} />

      <Presence
        show={!!unlockToast}
        from={{ opacity: 0, y: -16, scale: 0.96 }} to={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}
        duration={DUR.fast}
        role="status"
        className="fixed top-5 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-3 bg-foreground text-background pl-3 pr-5 py-2.5 rounded-2xl shadow-2xl cursor-pointer"
        onClick={() => { setUnlockToast(null); setShowAchievements(true); }}
      >
        <span className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center"><Trophy size={17} /></span>
        <span>
          <span className="block text-[10px] uppercase tracking-widest opacity-70">Achievement unlocked</span>
          <span className="block text-[14px] font-semibold">{unlockToast?.title}</span>
        </span>
      </Presence>

      {booted && !studio && (
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
          mood={mood} setMood={setMood}
          pairReason={pairReason}
          onFontAdded={handleFontAdded}
          onOpenStudio={openStudio}
        />

        <PreviewArea
          activeTab={activeTab}
          primaryFont={primaryFont} pControls={primaryControls}
          secondaryFont={secondaryFont} sControls={secondaryControls}
          sampleText={sampleText} setSampleText={setSampleText}
          bodyLineHeight={bodyLineHeight}
          revealKey={revealKey}
        />

        <ViewMenu activeTab={activeTab} setActiveTab={setActiveTab} corner={28} />

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
