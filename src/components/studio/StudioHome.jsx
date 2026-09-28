import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowUpRight, Trophy } from 'lucide-react';
import { gsap, useGSAP, EASE, prefersReducedMotion } from '@/lib/gsap';
import { STUDIO_SECTIONS } from '../../lib/studioCatalog';
import { ACHIEVEMENTS, useAchievements } from '../../lib/achievements';
import { stack } from '../../lib/typeStyles';
import ModeSwitch from './ModeSwitch';
import { AnimatePreview, PosterPreview, LabPreview, KernPreview, MatchPreview } from './StudioPreviews';

const PREVIEWS = {
    animate: AnimatePreview,
    poster: PosterPreview,
    lab: LabPreview,
    kern: KernPreview,
    match: MatchPreview,
};

/**
 * The Studio's front door — Create and Play as a gallery of big cards,
 * each running a live preview made from the current pair, instead of a
 * list of names in a popover. The switch at the top flips between the
 * Create and Play sides.
 */
export default function StudioHome({
    section, onSection, onPick, onAchievements,
    primaryFont, secondaryFont, pControls, text,
}) {
    const gridRef = useRef(null);
    const achievements = useAchievements();
    const current = STUDIO_SECTIONS[section] ?? STUDIO_SECTIONS.create;

    // The closest locked achievement — a nudge on the Play side.
    const next = ACHIEVEMENTS
        .filter((a) => !achievements.unlocked[a.id])
        .map((a) => { const [cur, goal] = a.progress(achievements); return { ...a, cur, goal, ratio: cur / goal }; })
        .sort((a, b) => b.ratio - a.ratio)[0];
    const unlocked = Object.keys(achievements.unlocked).length;

    useGSAP(() => {
        if (prefersReducedMotion()) return;
        gsap.from(gsap.utils.selector(gridRef)('[data-card]'), {
            opacity: 0, y: 22, scale: 0.98, duration: 0.5, ease: EASE.out, stagger: 0.06,
        });
    }, { scope: gridRef, dependencies: [section], revertOnUpdate: true });

    // Esc goes back to the editor, like closing any other layer.
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onSection('pair'); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onSection]);

    const props = { font: primaryFont, secondary: secondaryFont, weight: pControls.weight, text };

    return (
        <div className="fixed inset-0 z-[90] bg-background text-foreground flex flex-col">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 py-3 shrink-0">
                <button
                    onClick={() => onSection('pair')}
                    aria-label="Back to editor"
                    className="justify-self-start flex items-center gap-2 border border-border px-3 sm:px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-card"
                >
                    <ArrowLeft size={16} /> <span className="hidden sm:inline">Editor</span>
                </button>
                <ModeSwitch value={section} onChange={onSection} />
                <button
                    onClick={onAchievements}
                    className="justify-self-end flex items-center gap-2 border border-border px-3 py-2 rounded-full text-[13px] font-semibold hover:bg-card"
                    aria-label={`Achievements, ${unlocked} of ${ACHIEVEMENTS.length} unlocked`}
                >
                    <Trophy size={15} className="text-amber-500" />
                    <span className="tabular-nums">{unlocked}<span className="text-muted-foreground">/{ACHIEVEMENTS.length}</span></span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[1080px] mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16">
                    <div className="mb-7 sm:mb-9">
                        <h1 className="text-[28px] sm:text-[40px] font-semibold tracking-tight leading-[1.05]">{current.title}</h1>
                        <p className="mt-2 text-[14px] text-muted-foreground">
                            {section === 'create' ? (
                                <>Everything here uses <span className="text-foreground" style={{ fontFamily: stack(primaryFont) }}>{primaryFont}</span> and <span className="text-foreground" style={{ fontFamily: stack(secondaryFont) }}>{secondaryFont}</span>, your current pair.</>
                            ) : (
                                <>Quick games that sharpen how you see type — and quietly unlock achievements.</>
                            )}
                        </p>
                    </div>

                    <div ref={gridRef} className="grid gap-3 sm:gap-4 sm:grid-cols-3">
                        {current.items.map((item) => {
                            const Preview = PREVIEWS[item.id];
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    data-card
                                    onClick={() => onPick(item.id)}
                                    className="group text-left rounded-3xl border border-border bg-card overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    <div className="h-[168px] bg-muted/50 p-3 relative">
                                        {Preview && <Preview {...props} />}
                                    </div>
                                    <div className="p-4 sm:p-5 flex items-start gap-3">
                                        <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon size={17} /></span>
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-[15px] font-semibold">{item.label}</span>
                                            <span className="block text-[12.5px] text-muted-foreground leading-snug mt-0.5">{item.desc}</span>
                                        </span>
                                        <ArrowUpRight size={18} className="text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                                    </div>
                                </button>
                            );
                        })}

                        {section === 'play' && (
                            <button
                                data-card
                                onClick={onAchievements}
                                className="group text-left rounded-3xl border border-border bg-card p-5 flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-foreground/20"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-500 flex items-center justify-center"><Trophy size={17} /></span>
                                    <span className="text-[15px] font-semibold">Achievements</span>
                                    <span className="ml-auto text-[13px] tabular-nums text-muted-foreground">{unlocked}/{ACHIEVEMENTS.length}</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${(unlocked / ACHIEVEMENTS.length) * 100}%` }} />
                                </div>
                                {next && (
                                    <div className="text-[12.5px] text-muted-foreground leading-snug">
                                        Next up: <span className="text-foreground font-medium">{next.title}</span> — {next.desc.toLowerCase()}
                                        {next.goal > 1 && <span className="tabular-nums"> ({Math.min(next.cur, next.goal)}/{next.goal})</span>}
                                    </div>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
