import { useState, useRef, useEffect } from 'react';
import { Upload, ChevronLeft, ChevronRight, Download, RotateCcw } from 'lucide-react';
import { FONTS, FONT_METADATA, loadCustomFont } from '../../data/fonts';
import { loadFont } from '../../lib/fontLoader';
import { stack } from '../../lib/typeStyles';
import { cn } from '@/lib/utils';

/**
 * Upload the paid font you're trying to match, then press Space to cycle
 * through the free fonts on the site until one looks close enough — same
 * sample line rendered in both, side by side, so the comparison is direct.
 *
 * Deliberately excludes Wanted Sans (no public download page to send
 * someone to) and any other custom-uploaded fonts (those are references
 * people brought in themselves, not something to recommend as "free").
 */
export default function ComparePreview({ text }) {
  const [paidFamily, setPaidFamily] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const fileInputRef = useRef(null);

  const candidates = FONTS.filter((f) => {
    if (f === 'Wanted Sans') return false;
    return !FONT_METADATA.find((m) => m.family === f)?.custom;
  });
  const pos = candidates.length ? ((candidateIndex % candidates.length) + candidates.length) % candidates.length : 0;
  const candidate = candidates[pos];

  useEffect(() => { if (candidate) loadFont(candidate); }, [candidate]);

  // Only while there's something to compare against, and only Space with
  // no modifiers and no text field focused — same guard App.jsx uses for
  // its own shortcuts.
  useEffect(() => {
    if (!paidFamily) return;
    const handler = (e) => {
      if (e.key !== ' ') return;
      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      setCandidateIndex((i) => i + (e.shiftKey ? -1 : 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [paidFamily]);

  const handleFile = async (file) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const family = await loadCustomFont(file);
      setPaidFamily(family);
      setCandidateIndex(0);
    } catch (err) {
      setUploadError(err.message || 'Could not load that font.');
    } finally {
      setUploading(false);
    }
  };

  const sampleLine = text || 'The quick brown fox jumps over the lazy dog';

  if (!paidFamily) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 min-h-0">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          className={cn(
            "flex flex-col items-center gap-3 px-10 py-14 rounded-2xl border-2 border-dashed cursor-pointer transition-colors max-w-[440px]",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"
          )}
        >
          <Upload size={26} className="text-muted-foreground" strokeWidth={1.75} />
          <div className="text-[15px] font-semibold text-foreground">
            {uploading ? 'Loading font…' : 'Drop your paid font here'}
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Upload the commercial font you own, then press <strong>Space</strong> to
            cycle through free fonts on this site until one's close enough to use.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
        {uploadError && <p className="mt-4 text-[13px] text-destructive">{uploadError}</p>}
      </div>
    );
  }

  const googleFontsUrl = `https://fonts.google.com/specimen/${candidate.replace(/\s+/g, '+')}`;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-6 min-h-0">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Your font — {paidFamily}
        </span>
        <div
          className="text-[clamp(24px,4vw,42px)] leading-tight text-foreground [text-wrap:balance] max-w-[900px]"
          style={{ fontFamily: `'${paidFamily}', sans-serif` }}
        >
          {sampleLine}
        </div>
      </div>

      {/* Controls sit between the two panels, not below both — pinning them
          below would put the one thing you actually interact with in the
          same cramped strip the floating dock overlaps. */}
      <div className="shrink-0 flex flex-col items-center gap-2 py-4 border-y border-border">
        <div className="flex items-center gap-2 flex-wrap justify-center px-4">
          <button
            onClick={() => setCandidateIndex((i) => i - 1)}
            className="flex items-center gap-1 h-8 pl-2.5 pr-3 rounded-full text-foreground border border-border hover:bg-muted transition-colors text-[12px] font-medium"
          >
            <ChevronLeft size={14} /> Back
          </button>

          <span className="text-[12px] text-muted-foreground tabular-nums w-16 text-center shrink-0">
            {pos + 1} / {candidates.length}
          </span>

          <button
            onClick={() => setCandidateIndex((i) => i + 1)}
            className="flex items-center gap-1 h-8 pr-2.5 pl-3 rounded-full text-foreground border border-border hover:bg-muted transition-colors text-[12px] font-medium"
          >
            Next <ChevronRight size={14} />
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          <a
            href={googleFontsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-primary text-primary-foreground text-[12px] font-semibold hover:opacity-90 transition-opacity"
          >
            <Download size={13} /> Get {candidate} free
          </a>

          <button
            onClick={() => { setPaidFamily(null); setUploadError(null); }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground text-[12px] font-medium transition-colors"
          >
            <RotateCcw size={12} /> Change paid font
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground/70">
          Space for next · Shift+Space to go back
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-6 min-h-0">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-4">
          Free alternative — {candidate}
        </span>
        <div
          className="text-[clamp(24px,4vw,42px)] leading-tight text-foreground [text-wrap:balance] max-w-[900px]"
          style={{ fontFamily: stack(candidate) }}
        >
          {sampleLine}
        </div>
      </div>
    </div>
  );
}
