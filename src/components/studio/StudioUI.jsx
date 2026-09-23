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

export function Group({ title, children, aside }) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Chip({ active, onClick, children, className, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors',
        active ? 'bg-primary text-primary-foreground border-primary' : 'text-foreground border-border hover:bg-muted',
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
    <div className="flex flex-wrap gap-2">
      {palettes.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          aria-pressed={value === p.id}
          aria-label={p.label}
          title={p.label}
          className={cn('w-9 h-9 rounded-full border-2 flex items-center justify-center text-[13px] font-bold transition-transform', value === p.id ? 'border-primary scale-110' : 'border-border')}
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
