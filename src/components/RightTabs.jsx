import { useRef, useState } from 'react';
import { Keyboard } from 'lucide-react';
import { gsap, useGSAP, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';
import { TABS } from '../data/constants';
import { cn } from "@/lib/utils";

/**
 * Preview-mode switcher as a hover-expanding pill, bottom-left, sitting at
 * the same height as the bottom bar.
 *
 * Collapsed it shows only the active mode; hovering (or focusing anything
 * inside, so keyboard users get the same thing) reveals the rest. Because
 * it's anchored by `bottom`, growing taller extends it upward on its own —
 * no transform needed to open in that direction.
 *
 * It's fixed rather than a flex child: the old right rail reserved 268px of
 * layout width permanently to display four buttons, and the preview keeps
 * that space now.
 */
export default function RightTabs({ activeTab, setActiveTab }) {
    const scope = useRef(null);
    const [expanded, setExpanded] = useState(false);

    useGSAP(
        () => {
            if (prefersReducedMotion()) return;
            gsap.from(scope.current, {
                opacity: 0,
                y: 24,
                duration: DUR.slow,
                ease: EASE.out,
                delay: 0.2,
            });
        },
        { scope }
    );

    return (
        <nav
            ref={scope}
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
            onFocusCapture={() => setExpanded(true)}
            onBlurCapture={(e) => {
                // Only collapse once focus has left the pill entirely.
                if (!e.currentTarget.contains(e.relatedTarget)) setExpanded(false);
            }}
            /* Anchored to the bar's left edge, not the viewport's: the bar is
               centred at a fixed 640px on lg+, so half of that (320) plus a
               12px gutter puts this right up against it. Anchoring the RIGHT
               edge also means expanding grows leftward, away from the bar,
               instead of over it. */
            /* col-reverse puts the mode switcher at the bottom of the stack so
               it lines up with the bar; Shortcuts rides above it and gets
               pushed further up as the switcher expands. */
            className="hidden lg:flex fixed right-[calc(50%+332px)] bottom-6 z-40 flex-col-reverse items-end gap-2"
            aria-label="Preview mode"
        >
            <div
                role="tablist"
                aria-label="Preview mode"
                aria-orientation="vertical"
                /* Collapsed the box is 50x50 (36px row + 12px padding + 2px
                   border) so rounded-full renders a true circle; expanded it
                   relaxes to a 28px pill. The gap has to collapse too — flex
                   gaps still apply between zero-height rows, and three of them
                   were adding 12px that stopped it being square. */
                className={cn(
                    "flex flex-col p-1.5 bg-background/90 backdrop-blur-xl border border-border shadow-lg",
                    "transition-[border-radius,row-gap,box-shadow] duration-300 ease-out hover:shadow-xl",
                    expanded ? "gap-1 rounded-[28px]" : "gap-0 rounded-full"
                )}
            >
                {TABS.map((tab) => {
                    const isActive = tab.id === activeTab;
                    const Icon = tab.icon;
                    // Collapsed, only the active mode occupies space; the rest
                    // animate their height open so the pill grows smoothly.
                    const visible = isActive || expanded;
                    return (
                        <button
                            key={tab.id}
                            data-tab={tab.id}
                            role="tab"
                            aria-selected={isActive}
                            tabIndex={visible ? 0 : -1}
                            onClick={() => setActiveTab(tab.id)}
                            title={tab.label}
                            /* row-reverse keeps the icon column pinned to the
                               right edge beside the bar, so labels grow out to
                               the left and the icons never move under the
                               cursor mid-hover. */
                            className={cn(
                                "flex flex-row-reverse items-center rounded-full overflow-hidden whitespace-nowrap",
                                "transition-[height,opacity,background-color,color] duration-300 ease-out",
                                visible ? "h-9 opacity-100" : "h-0 opacity-0 pointer-events-none",
                                isActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <span className="shrink-0 w-9 h-9 flex items-center justify-center">
                                <Icon size={17} />
                            </span>
                            {/* min-w-0 matters: as a flex item this span
                                defaults to min-width:auto, which outranks
                                max-w-0 and leaves the label's full width
                                behind — that's what stopped the collapsed
                                pill from being square. Padding is on the
                                expanded branch only for the same reason. */}
                            <span
                                className={cn(
                                    "text-[13px] min-w-0 transition-[max-width,opacity,padding] duration-300 ease-out",
                                    expanded ? "max-w-[120px] opacity-100 pl-4" : "max-w-0 opacity-0 pl-0"
                                )}
                            >
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            <button
                onClick={() => window.dispatchEvent(new CustomEvent('jmt:showShortcuts'))}
                aria-label="Keyboard shortcuts"
                title="Keyboard shortcuts"
                className={cn(
                    "flex flex-row-reverse items-center gap-2 rounded-full bg-background/90 backdrop-blur-xl border border-border shadow-sm",
                    "text-muted-foreground hover:text-foreground transition-all duration-300 overflow-hidden whitespace-nowrap",
                    expanded ? "h-8 px-3 opacity-100" : "h-8 w-8 px-0 justify-center opacity-70"
                )}
            >
                <Keyboard size={13} className="shrink-0" />
                <span
                    className={cn(
                        "text-[11px] min-w-0 transition-[max-width,opacity] duration-300",
                        expanded ? "max-w-[120px] opacity-100" : "max-w-0 opacity-0"
                    )}
                >
                    Shortcuts
                </span>
            </button>
        </nav>
    );
}
