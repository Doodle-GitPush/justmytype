import { useState } from 'react';
import { Sparkles, Frame, Grid3x3, MoveHorizontal, Heart, Trophy } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ACHIEVEMENTS, useAchievements } from '../lib/achievements';

const SECTIONS = [
  {
    title: 'Create',
    items: [
      { id: 'animate', label: 'Animate', desc: 'Kinetic type, export video & GIF', icon: Sparkles },
      { id: 'poster', label: 'Poster', desc: 'Layer, rotate and blend type', icon: Frame },
      { id: 'lab', label: 'Letter Lab', desc: 'Patterns built from letters', icon: Grid3x3 },
    ],
  },
  {
    title: 'Play',
    items: [
      { id: 'kern', label: 'Kern Game', desc: 'Space the letters by eye', icon: MoveHorizontal },
      { id: 'match', label: 'Type Match', desc: 'Swipe on font pairings', icon: Heart },
    ],
  },
];

/** The one entry point to every studio and game, beside the dock. */
export default function StudioLauncher({ onOpen }) {
  const [open, setOpen] = useState(false);
  const achievements = useAchievements();
  const unlocked = Object.keys(achievements.unlocked).length;

  const go = (id) => { setOpen(false); onOpen(id); };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Open studios and games"
          className="pointer-events-auto shrink-0 flex items-center gap-2 h-[52px] px-4 rounded-full bg-background/90 backdrop-blur-xl border border-border shadow-xl text-primary transition-all hover:bg-card hover:scale-105 active:scale-95"
        >
          <Sparkles size={16} />
          <span className="text-[13px] font-semibold hidden sm:inline">Studio</span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" sideOffset={12} className="w-[280px] p-2 rounded-2xl">
        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-1">
            <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{section.title}</div>
            {section.items.map(({ id, label, desc, icon: Icon }) => (
              <button key={id} onClick={() => go(id)} className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted text-left">
                <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon size={16} /></span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-foreground">{label}</span>
                  <span className="block text-[11px] text-muted-foreground truncate">{desc}</span>
                </span>
              </button>
            ))}
          </div>
        ))}
        <div className="border-t border-border mt-1 pt-1">
          <button onClick={() => go('achievements')} className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted text-left">
            <span className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-500 flex items-center justify-center shrink-0"><Trophy size={16} /></span>
            <span className="flex-1 text-[13px] font-semibold text-foreground">Achievements</span>
            <span className="text-[11px] tabular-nums text-muted-foreground">{unlocked}/{ACHIEVEMENTS.length}</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
