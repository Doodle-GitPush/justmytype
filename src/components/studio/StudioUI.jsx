import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Top bar shared by every full-screen studio. */
export function StudioHeader({ title, subtitle, subtitleStyle, onExit, children }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border shrink-0">
      <button
        onClick={onExit}
        aria-label="Back to editor"
        className="flex items-center gap-2 bg-background/80 backdrop-blur border border-border px-4 py-2 rounded-full text-[13px] font-semibold shadow-sm transition-all hover:bg-card text-foreground"
      >
        <ArrowLeft size={16} />
        <span className="hidden sm:inline">Back to editor</span>
      </button>
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground truncate">
        <span className="hidden sm:inline">{title}</span>
        {subtitle && <span className="text-foreground font-medium truncate max-w-[40vw]" style={subtitleStyle}>{subtitle}</span>}
      </div>
      <div className="flex items-center gap-2 min-w-[40px] justify-end">{children}</div>
    </div>
  );
}

/**
 * The inspector column every studio uses: an optional segmented switcher
 * on top, scrolling sections in the middle (separated by hairlines rather
 * than floating in one long list), and a footer pinned to the bottom so
 * the primary action never scrolls out of reach.
 */
export function StudioPanel({ top, footer, children }) {
  return (
    <aside className="flex-1 lg:flex-none lg:w-[340px] min-h-0 shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-background flex flex-col">
      {top && <div className="px-4 sm:px-5 pt-4 pb-1 shrink-0">{top}</div>}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 divide-y divide-border/60">{children}</div>
      {footer && <div className="shrink-0 border-t border-border px-4 sm:px-5 py-3.5 bg-card/60 flex flex-col gap-2.5">{footer}</div>}
    </aside>
  );
}

/** The stage beside a StudioPanel — fixed share of the screen on mobile, the rest on desktop. */
export const stageClass = 'h-[50vh] lg:h-auto flex-none lg:flex-1 min-h-0 bg-muted/40';

export function Group({ title, children, aside }) {
  return (
    <section className="flex flex-col gap-3 py-5">
      <div className="flex items-center justify-between min-h-[20px]">
        <h3 className="text-[11px] font-semibold text-foreground">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** iOS-style segmented control — one choice out of a few. */
export function Segmented({ options, value, onChange, className }) {
  return (
    <div role="tablist" className={cn('flex p-1 bg-muted rounded-xl gap-1', className)}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'flex-1 min-w-0 truncate px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all',
            value === o.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
          style={o.style}
        >
          {o.label}
          {o.badge !== undefined && <span className="ml-1 text-muted-foreground tabular-nums">{o.badge}</span>}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, onClick, children, className, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors disabled:opacity-50',
        active ? 'bg-primary/10 text-primary border-primary/50' : 'text-foreground/80 border-border hover:bg-muted hover:text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Swatches({ palettes, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {palettes.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          aria-pressed={value === p.id}
          aria-label={p.label}
          title={p.label}
          className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all ring-offset-2 ring-offset-background', value === p.id ? 'ring-2 ring-primary' : 'ring-1 ring-border hover:ring-foreground/30')}
          style={{ background: p.bg, color: p.fg }}
        >
          Aa
        </button>
      ))}
    </div>
  );
}

/** A colour well with its hex value. */
export function ColorField({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2 h-8 rounded-lg border border-border bg-card px-2 text-[11px] text-muted-foreground">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-5 h-5 rounded border-0 bg-transparent p-0 cursor-pointer" />
      <span className="uppercase tracking-wider font-semibold">{label}</span>
      <span className="ml-auto font-mono text-foreground">{value}</span>
    </label>
  );
}
