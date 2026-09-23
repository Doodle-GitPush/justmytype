import { useEffect, useMemo, useState } from 'react';
import { Search, Copy, Check, Loader2 } from 'lucide-react';
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

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-5 pb-6 lg:pt-14 min-h-0">
      {/* Inspector */}
      <aside className="lg:w-[300px] shrink-0 flex flex-col gap-3">
        <div className="flex p-1 bg-muted rounded-full">
          {[['primary', primaryFont], ['secondary', secondaryFont]].map(([id, f]) => (
            <button
              key={id}
              onClick={() => setWhich(id)}
              aria-pressed={which === id}
              className={cn('flex-1 text-[12px] py-1.5 rounded-full truncate px-2 transition-colors', which === id ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground')}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col items-center">
          <div className="h-[200px] w-full flex items-center justify-center text-foreground text-[150px] leading-none relative overflow-hidden" style={face}>
            {/* Metric guides — baseline and x-height-ish — so the glyph reads as placed, not floating. */}
            <div className="absolute inset-x-0 top-[70%] h-px bg-primary/25" />
            <div className="absolute inset-x-0 top-[38%] h-px bg-border" />
            <span className="relative">{sel}</span>
          </div>
          {selected !== null && (
            <div className="w-full mt-3 flex flex-col gap-1.5 text-[12px]">
              {[
                ['Unicode', `U+${hex(selected)}`],
                ['HTML', `&#x${hex(selected)};`],
                ['CSS', `\\${hex(selected)}`],
                ['JS', selected > 0xffff ? `\\u{${hex(selected)}}` : `\\u${hex(selected)}`],
              ].map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => copy(v, k)}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-muted text-left"
                >
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono text-foreground flex items-center gap-1.5">
                    {v} {copied === k ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="opacity-40" />}
                  </span>
                </button>
              ))}
              <button
                onClick={() => copy(sel, 'glyph')}
                className="mt-1 h-9 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2"
              >
                {copied === 'glyph' ? <Check size={14} /> : <Copy size={14} />} Copy glyph
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Grid */}
      <section className="flex-1 min-w-0 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 h-9 px-3 rounded-full border border-border bg-card flex-1 min-w-[180px]">
            <Search size={14} className="text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a character or U+0041"
              aria-label="Search glyphs"
              className="bg-transparent outline-none text-[13px] flex-1 min-w-0"
            />
          </div>
          <span className="text-[12px] text-muted-foreground tabular-nums">
            {loading ? 'Scanning…' : `${total.toLocaleString()} glyphs`}
          </span>
        </div>

        {!loading && state.groups.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {['All', ...state.groups.map((g) => g.name)].map((name) => (
              <button
                key={name}
                onClick={() => { setGroup(name); setLimit(PAGE); }}
                aria-pressed={group === name}
                className={cn('text-[11px] px-2.5 py-1 rounded-full border transition-colors', group === name ? 'bg-foreground text-background border-foreground' : 'text-muted-foreground border-border hover:text-foreground')}
              >
                {name}
                {name !== 'All' && <span className="opacity-60 ml-1 tabular-nums">{state.groups.find((g) => g.name === name)?.glyphs.length}</span>}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20 text-muted-foreground gap-2 text-[13px]">
            <Loader2 size={16} className="animate-spin" /> Reading {family}’s character set…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-1.5">
              {visible.slice(0, limit).map((cp) => (
                <button
                  key={cp}
                  onClick={() => setSelected(cp)}
                  onDoubleClick={() => copy(String.fromCodePoint(cp), 'glyph')}
                  title={`U+${hex(cp)} — double-click to copy`}
                  className={cn(
                    'aspect-square rounded-lg border flex flex-col items-center justify-center transition-colors',
                    selected === cp ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-foreground/30'
                  )}
                >
                  <span className="text-[24px] leading-none text-foreground" style={face}>{String.fromCodePoint(cp)}</span>
                  <span className="text-[8px] font-mono text-muted-foreground mt-1">{hex(cp)}</span>
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
            {!visible.length && <div className="text-[13px] text-muted-foreground py-10 text-center">No glyphs match.</div>}
          </>
        )}
      </section>
    </div>
  );
}
