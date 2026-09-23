import { Trophy, Lock, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ACHIEVEMENTS, useAchievements, resetAchievements } from '../lib/achievements';
import { cn } from '@/lib/utils';

/** Every achievement with its progress — unlocked ones first. */
export default function AchievementsPanel({ open, onOpenChange }) {
  const state = useAchievements();
  const rows = ACHIEVEMENTS.map((a) => {
    const [cur, goal] = a.progress(state);
    return { ...a, cur: Math.min(cur, goal), goal, unlockedAt: state.unlocked[a.id] };
  }).sort((a, b) => (b.unlockedAt ? 1 : 0) - (a.unlockedAt ? 1 : 0) || b.cur / b.goal - a.cur / a.goal);
  const unlocked = rows.filter((r) => r.unlockedAt).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] w-[94vw] max-h-[86vh] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl z-[100]">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-[17px]">
            <Trophy size={18} className="text-primary" /> Achievements
          </DialogTitle>
          <DialogDescription className="text-[13px] mt-1">
            {unlocked} of {rows.length} unlocked · saved in this browser
          </DialogDescription>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-[width] duration-500" style={{ width: `${(unlocked / rows.length) * 100}%` }} />
          </div>
        </div>
        <div className="overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className={cn('rounded-xl border p-3 flex gap-3 items-start', r.unlockedAt ? 'border-primary/40 bg-primary/5' : 'border-border')}
            >
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', r.unlockedAt ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                {r.unlockedAt ? <Check size={15} /> : <Lock size={13} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-foreground">{r.title}</div>
                <div className="text-[12px] text-muted-foreground leading-snug">{r.desc}</div>
                {!r.unlockedAt && r.goal > 1 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary/70" style={{ width: `${(r.cur / r.goal) * 100}%` }} />
                    </div>
                    <span className="text-[10px] tabular-nums text-muted-foreground">{r.cur}/{r.goal}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-border flex justify-end">
          <button
            onClick={() => { if (window.confirm('Reset all achievement progress?')) resetAchievements(); }}
            className="text-[12px] text-muted-foreground hover:text-destructive"
          >
            Reset progress
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
