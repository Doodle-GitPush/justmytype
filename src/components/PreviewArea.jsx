import { useRef, useState, useEffect } from 'react';
import { gsap, useGSAP, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';
import { SAMPLE } from '../data/content';
import { typeStyle } from '../lib/typeStyles';
import FocusPreview from './previews/FocusPreview';
import ArticlePreview from './previews/ArticlePreview';
import HeroPreview from './previews/HeroPreview';
import SpecimenPreview from './previews/SpecimenPreview';

const VIEWS = {
  focus: FocusPreview,
  article: ArticlePreview,
  hero: HeroPreview,
  specimen: SpecimenPreview,
};

export default function PreviewArea({
  activeTab,
  primaryFont,
  pControls,
  secondaryFont,
  sControls,
  sampleText,
  bodyLineHeight,
  revealKey,
}) {
  const stage = useRef(null);
  const reduced = prefersReducedMotion();
  // The tab currently painted — lags `activeTab` by one exit animation.
  // With reduced motion there is no exit tween, so it tracks `activeTab` directly.
  const [pendingTab, setPendingTab] = useState(activeTab);
  const shownTab = reduced ? activeTab : pendingTab;

  const pStyle = typeStyle(primaryFont, pControls);
  const sStyle = typeStyle(secondaryFont, sControls, bodyLineHeight);
  const text = sampleText || SAMPLE.title;

  // Animate the outgoing view out, then swap. Replaces AnimatePresence mode="wait".
  useEffect(() => {
    if (reduced || activeTab === pendingTab) return;
    const el = stage.current;
    if (!el) return;

    const tween = gsap.to(el, {
      opacity: 0,
      y: -12,
      scale: 0.985,
      duration: DUR.fast,
      ease: EASE.in,
      onComplete: () => setPendingTab(activeTab),
    });
    return () => tween.kill();
  }, [activeTab, pendingTab, reduced]);

  // Animate the incoming view in.
  useGSAP(
    () => {
      const el = stage.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { opacity: 1, y: 0, scale: 1 });
        return;
      }
      gsap.fromTo(
        el,
        { opacity: 0, y: 14, scale: 0.99 },
        { opacity: 1, y: 0, scale: 1, duration: DUR.base, ease: EASE.out, clearProps: 'transform' }
      );
    },
    { dependencies: [shownTab] }
  );

  const View = VIEWS[shownTab] ?? ArticlePreview;

  return (
    <main
      id="jmt-preview-area"
      className="flex-1 h-auto lg:h-full overflow-visible lg:overflow-hidden flex flex-col p-3 px-4 lg:px-6 pb-28 lg:pb-7 bg-background relative"
    >
      <div className="flex-1 flex flex-col overflow-visible lg:overflow-y-auto scrollbar-hide relative min-h-0 pt-2">
        <div ref={stage} className="flex-1 flex flex-col">
          <View
            pStyle={pStyle}
            sStyle={sStyle}
            pControls={pControls}
            sControls={sControls}
            primaryFont={primaryFont}
            secondaryFont={secondaryFont}
            text={text}
            revealKey={revealKey}
            bodyLineHeight={bodyLineHeight}
          />
        </div>
      </div>
    </main>
  );
}
