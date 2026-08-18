import { useRef, useLayoutEffect } from 'react';
import { Keyboard } from 'lucide-react';
import { gsap, useGSAP, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';
import { TABS } from '../data/constants';

export default function RightTabs({
    activeTab, setActiveTab,
    THEMES, theme, setTheme,
}) {
    const scope = useRef(null);
    const listRef = useRef(null);
    const indicatorRef = useRef(null);

    // Rail entrance.
    useGSAP(
        () => {
            if (prefersReducedMotion()) return;
            gsap.from(gsap.utils.selector(scope)('[data-rail]'), {
                opacity: 0,
                x: 24,
                duration: DUR.slow,
                ease: EASE.out,
                stagger: 0.07,
                delay: 0.1,
            });
        },
        { scope }
    );

    // Slide the active-tab pill. Replaces framer's shared-element `layoutId`.
    useLayoutEffect(() => {
        const list = listRef.current;
        const pill = indicatorRef.current;
        if (!list || !pill) return;

        const btn = list.querySelector(`[data-tab="${activeTab}"]`);
        if (!btn) return;

        const target = { y: btn.offsetTop, height: btn.offsetHeight };

        // First paint positions without animating.
        if (!pill.dataset.ready) {
            gsap.set(pill, { ...target, opacity: 1 });
            pill.dataset.ready = 'true';
            return;
        }

        gsap.to(pill, {
            ...target,
            duration: prefersReducedMotion() ? 0 : DUR.base,
            ease: 'power3.out',
            overwrite: 'auto',
        });
    }, [activeTab]);

    return (
        <nav
            ref={scope}
            className="hidden lg:flex w-[268px] min-w-[268px] h-full flex-col justify-center items-stretch gap-4 py-5 pr-8 pl-3 bg-background shrink-0 z-10 relative"
        >
            {/* Preview mode switcher */}
            <div
                ref={listRef}
                data-rail
                className="bg-muted/60 ring-1 ring-border/70 rounded-2xl p-1 flex flex-col relative"
                role="tablist"
                aria-label="Preview mode"
            >
                <div
                    ref={indicatorRef}
                    aria-hidden="true"
                    className="absolute left-1 right-1 bg-card rounded-xl shadow-sm ring-1 ring-border/50 opacity-0 pointer-events-none"
                />
                {TABS.map((tab) => {
                    const isActive = tab.id === activeTab;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            data-tab={tab.id}
                            role="tab"
                            aria-selected={isActive}
                            className={`flex items-center gap-2.5 py-2.5 px-4 shrink-0 rounded-xl bg-transparent text-[14px] font-medium text-left relative z-10 transition-colors duration-200 ${
                                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={18} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Accent colour */}
            <div data-rail className="flex flex-col gap-3 px-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Accent Colour</span>
                <div className="flex items-center gap-3">
                    {THEMES.map((t) => {
                        const selected = theme === t.name;
                        return (
                            <button
                                key={t.name}
                                onClick={() => setTheme(t.name)}
                                aria-label={`${t.name} accent`}
                                aria-pressed={selected}
                                className={`w-5 h-5 rounded-full transition-transform duration-200 hover:scale-115 ${t.hex} ${
                                    selected
                                        ? 'ring-2 ring-offset-2 ring-offset-background ring-primary'
                                        : 'ring-1 ring-black/10 dark:ring-white/15'
                                }`}
                            />
                        );
                    })}
                </div>
            </div>

            <div data-rail className="px-2">
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('jmt:showShortcuts'))}
                    className="flex items-center gap-2 text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors"
                >
                    <Keyboard size={12} />
                    Keyboard shortcuts
                    <kbd className="text-[10px] px-1.5 py-0.5 bg-muted border border-border rounded font-mono">?</kbd>
                </button>
            </div>
        </nav>
    );
}

