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
            className="hidden lg:flex fixed left-6 bottom-6 z-40 flex-col items-start gap-2"
            aria-label="Preview mode"
        >
            <div
                role="tablist"
                aria-label="Preview mode"
                aria-orientation="vertical"
                className="flex flex-col gap-1 p-1.5 rounded-[26px] bg-background/90 backdrop-blur-xl border border-border shadow-lg transition-shadow duration-300 hover:shadow-xl"
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
                            className={cn(
                                "flex items-center gap-2.5 rounded-full overflow-hidden whitespace-nowrap",
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
                            {/* Padding lives in the expanded branch only —
                                a collapsed max-w-0 span still renders its
                                padding, which pads the pill out for nothing. */}
                            <span
                                className={cn(
                                    "text-[13px] transition-[max-width,opacity,padding] duration-300 ease-out",
                                    expanded ? "max-w-[120px] opacity-100 pr-4" : "max-w-0 opacity-0 pr-0"
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
                    "flex items-center gap-2 rounded-full bg-background/90 backdrop-blur-xl border border-border shadow-sm",
                    "text-muted-foreground hover:text-foreground transition-all duration-300 overflow-hidden whitespace-nowrap",
                    expanded ? "h-8 px-3 opacity-100" : "h-8 w-8 px-0 justify-center opacity-70"
                )}
            >
                <Keyboard size={13} className="shrink-0" />
                <span
                    className={cn(
                        "text-[11px] transition-[max-width,opacity] duration-300",
                        expanded ? "max-w-[120px] opacity-100" : "max-w-0 opacity-0"
                    )}
                >
                    Shortcuts
                </span>
            </button>
        </nav>
    );
}
