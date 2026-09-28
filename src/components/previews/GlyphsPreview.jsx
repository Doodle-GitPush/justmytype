import { useEffect, useMemo, useState } from 'react';
import { Search, Copy, Check } from 'lucide-react';
import { findGlyphs, hex } from '../../lib/glyphs';
import { faceOf } from '../../lib/typeStyles';
import { FONT_METADATA } from '../../data/fonts';
import { track } from '../../lib/achievements';
import { cn } from '@/lib/utils';

const PAGE = 480;

/**
 * Every character a font draws, grouped by script subset. Click a cell to
 * select it (big preview + codes), double-click or use Copy to put it on
 * the clipboard.
 */
export default function GlyphsPreview({ primaryFont, secondaryFont, pStyle, sStyle }) {
  const [which, setWhich] = useState('primary');
  const family = which === 'primary' ? primaryFont : secondaryFont;
  const face = faceOf(which === 'primary' ? pStyle : sStyle);

  const [state, setState] = useState({ family: null, groups: [] });
  const [group, setGroup] = useState('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [limit, setLimit] = useState(PAGE);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const meta = FONT_METADATA.find((m) => m.family === family);
    const isLocal = !!meta?.custom || family === 'Wanted Sans';
    findGlyphs(family, { isLocal }).then((groups) => {
      if (cancelled) return;
      setState({ family, groups });
      setGroup('All');
      setLimit(PAGE);
      setSelected(groups[0]?.glyphs.find((cp) => cp === 0x61) ?? groups[0]?.glyphs[0] ?? null);
    });
    return () => { cancelled = true; };
  }, [family]);

  const loading = state.family !== family;
  const total = state.groups.reduce((n, g) => n + g.glyphs.length, 0);

  const visible = useMemo(() => {
    const pool = group === 'All'
      ? state.groups.flatMap((g) => g.glyphs)
      : state.groups.find((g) => g.name === group)?.glyphs ?? [];
    const q = query.trim();
    if (!q) return pool;
    const asHex = q.replace(/^(u\+|0x|\\u)/i, '');
    const hexMatch = /^[0-9a-f]{2,6}$/i.test(asHex) ? parseInt(asHex, 16) : null;
    return pool.filter((cp) => String.fromCodePoint(cp) === q || cp === hexMatch || hex(cp).includes(asHex.toUpperCase()));
  }, [state.groups, group, query]);

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1400);
      track('glyph-copy');
    } catch { /* clipboard unavailable */ }
  };

  const sel = selected !== null ? String.fromCodePoint(selected) : '';

  const codes = selected === null ? [] : [
    ['Unicode', `U+${hex(selected)}`],
    ['HTML', `&#x${hex(selected)};`],
    ['CSS', `\\${hex(selected)}`],
    ['JS', selected > 0xffff ? `\\u{${hex(selected)}}` : `\\u${hex(selected)}`],
  ];
  const groupNames = ['All', ...state.groups.map((g) => g.name)];

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-5 lg:gap-8 pb-44 lg:pb-6 lg:pt-14 min-h-0">
      {/* Inspector — sticks beside the grid on desktop, a compact card on top on mobile. */}
      <aside className="lg:w-[280px] shrink-0 flex flex-col gap-3 lg:sticky lg:top-14 lg:self-start">
        <div className="flex p-1 bg-muted rounded-xl">
          {[['primary', primaryFont], ['secondary', secondaryFont]].map(([id, f]) => (
            <button
              key={id}
              onClick={() => setWhich(id)}
              aria-pressed={which === id}
              className={cn('flex-1 min-w-0 text-[12px] py-1.5 rounded-lg truncate px-2 transition-all', which === id ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground')}
              style={{ fontFamily: `'${f}', sans-serif` }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-row lg:flex-col">
          <div
            className="relative shrink-0 w-[128px] h-[128px] lg:w-full lg:h-[220px] flex items-center justify-center text-foreground text-[84px] lg:text-[160px] leading-none overflow-hidden bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:14px_14px]"
            style={face}
          >
            {/* Baseline and x-height-ish guides, so the glyph reads as set, not floating. */}
            <div className="absolute inset-x-0 top-[70%] h-px bg-primary/30" />
            <div className="absolute inset-x-0 top-[38%] h-px bg-border" />
            <span className="relative">{sel}</span>
          </div>
          {selected !== null && (
            <div className="flex-1 min-w-0 p-3 lg:p-4 flex flex-col gap-2 border-l lg:border-l-0 lg:border-t border-border">
              <div className="grid grid-cols-2 gap-1.5">
                {codes.map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => copy(v, k)}
                    title={`Copy ${k}`}
                    className="group flex flex-col items-start rounded-lg bg-muted/60 hover:bg-muted px-2 py-1.5 text-left min-w-0"
                  >
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      {k} {copied === k ? <Check size={9} className="text-emerald-600" /> : <Copy size={9} className="opacity-0 group-hover:opacity-60" />}
                    </span>
                    <span className="font-mono text-[11px] text-foreground truncate max-w-full">{v}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => copy(sel, 'glyph')}
                className="h-9 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-primary/95"
              >
                {copied === 'glyph' ? <Check size={14} /> : <Copy size={14} />} {copied === 'glyph' ? 'Copied' : 'Copy glyph'}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Grid */}
      <section className="flex-1 min-w-0 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-border bg-card flex-1 min-w-0 focus-within:ring-2 focus-within:ring-primary/30">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a character or U+0041"
              aria-label="Search glyphs"
              className="bg-transparent outline-none text-[13px] flex-1 min-w-0"
            />
          </div>
          <span className="shrink-0 text-[12px] text-muted-foreground tabular-nums px-1">
            {loading ? 'Scanning…' : `${total.toLocaleString()} glyphs`}
          </span>
        </div>

        {!loading && state.groups.length > 1 && (
          <div className="-mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5 w-max lg:w-auto lg:flex-wrap">
              {groupNames.map((name) => (
                <button
                  key={name}
                  onClick={() => { setGroup(name); setLimit(PAGE); }}
                  aria-pressed={group === name}
                  className={cn('shrink-0 text-[12px] px-3 py-1.5 rounded-full border transition-colors', group === name ? 'bg-foreground text-background border-foreground' : 'text-muted-foreground border-border hover:text-foreground hover:border-foreground/30')}
                >
                  {name}
                  {name !== 'All' && <span className="opacity-60 ml-1 tabular-nums">{state.groups.find((g) => g.name === name)?.glyphs.length}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-1" aria-busy="true" aria-label={`Reading ${family}’s character set`}>
            {Array.from({ length: 48 }, (_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" style={{ animationDelay: `${(i % 12) * 60}ms` }} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-1">
              {visible.slice(0, limit).map((cp) => (
                <button
                  key={cp}
                  onClick={() => setSelected(cp)}
                  onDoubleClick={() => copy(String.fromCodePoint(cp), 'glyph')}
                  title={`U+${hex(cp)} — double-click to copy`}
                  className={cn(
                    'group aspect-square rounded-lg flex flex-col items-center justify-center transition-all',
                    selected === cp
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card hover:bg-muted text-foreground ring-1 ring-border/60'
                  )}
                >
                  <span className="text-[22px] leading-none" style={face}>{String.fromCodePoint(cp)}</span>
                  <span className={cn('text-[8px] font-mono mt-1 transition-opacity', selected === cp ? 'opacity-80' : 'opacity-0 group-hover:opacity-60')}>{hex(cp)}</span>
                </button>
              ))}
            </div>
            {visible.length > limit && (
              <button
                onClick={() => setLimit((l) => l + PAGE)}
                className="self-center mt-2 text-[12px] px-4 py-2 rounded-full border border-border hover:bg-muted"
              >
                Show more ({(visible.length - limit).toLocaleString()} left)
              </button>
            )}
            {!visible.length && <div className="text-[13px] text-muted-foreground py-10 text-center">No glyphs match “{query}”.</div>}
          </>
        )}
      </section>
    </div>
  );
}
