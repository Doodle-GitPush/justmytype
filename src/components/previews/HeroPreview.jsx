import { useRef } from 'react';
import { Layers, Zap, ShieldCheck } from 'lucide-react';
import { gsap, useGSAP, SplitText, ScrollTrigger, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';
import { SAMPLE } from '../../data/content';

const NAV_LINKS = ['Product', 'Resources', 'Pricing'];
const FEATURES = [
  { icon: Layers, title: SAMPLE.cardTitles[0], body: SAMPLE.cardBodies[0] },
  { icon: Zap, title: SAMPLE.cardTitles[1], body: SAMPLE.cardBodies[1] },
  { icon: ShieldCheck, title: SAMPLE.cardTitles[2], body: SAMPLE.cardBodies[2] },
];

/**
 * A full scrollable site — nav, hero, features, testimonial, CTA, footer —
 * kept deliberately plain: one thin-bordered frame, no macOS-dot chrome
 * doubling up on the nav bar underneath it, no colored icon blobs or
 * gradient bands. The type pair is the only thing meant to stand out.
 */
// The site is no longer height-boxed with its own internal scrollbar — it
// fills the preview pane and scrolls with it, which means the *actual*
// scrolling ancestor for ScrollTrigger differs by breakpoint (the app root
// on mobile, a specific inner div on desktop). Walk up and find whichever
// one is actually overflowing right now instead of hardcoding either.
const findScrollParent = (el) => {
  let node = el?.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return window;
};

export default function HeroPreview({ pStyle, sStyle, text, revealKey }) {
  const scope = useRef(null);
  const headline = text || SAMPLE.heroTitle;

  useGSAP(
    () => {
      const q = gsap.utils.selector(scope);

      if (prefersReducedMotion()) {
        gsap.set(q('[data-hero]'), { opacity: 1, y: 0, rotateX: 0 });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: EASE.out } });
      tl.from(q('[data-frame]'), { rotateX: 14, y: 40, opacity: 0, duration: 0.8 })
        .from(q('[data-nav-item]'), { opacity: 0, y: -8, duration: DUR.base, stagger: 0.06 }, 0.3)
        .from(q('[data-hero-eyebrow]'), { opacity: 0, y: 10, duration: DUR.base }, 0.4)
        .from(q('[data-hero-sub]'), { opacity: 0, y: 16, duration: DUR.slow }, 0.7)
        .from(q('[data-hero-cta]'), { opacity: 0, y: 16, duration: DUR.slow, stagger: 0.08 }, 0.85);

      const split = SplitText.create(q('[data-hero-title]'), {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110, opacity: 0, duration: DUR.type, ease: EASE.type, stagger: 0.1, delay: 0.45,
          }),
      });

      const activeScroller = findScrollParent(scope.current);
      q('[data-scroll-in]').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 24,
          duration: DUR.slow,
          ease: EASE.out,
          scrollTrigger: { trigger: el, scroller: activeScroller, start: 'top bottom-=40', once: true },
        });
      });

      const settle = setTimeout(() => ScrollTrigger.refresh(), 400);
      document.fonts.ready.then(() => ScrollTrigger.refresh());

      return () => {
        clearTimeout(settle);
        split.revert();
      };
    },
    { scope, dependencies: [revealKey], revertOnUpdate: true }
  );

  return (
    <div ref={scope} className="w-full flex-1 flex flex-col [perspective:2000px]">
      <div
        data-frame
        data-hero
        className="w-full flex-1 bg-background flex flex-col"
      >
        <div className="relative w-full flex-1 min-h-[500px] bg-background flex flex-col">
          {/* Nav — doubles as the frame's top bar, so there's one piece of
              chrome instead of a browser bar stacked on top of a site nav. */}
          <nav className="flex items-center justify-between w-full py-4 px-6 md:px-10 bg-background/90 backdrop-blur-md border-b border-border sticky top-0 z-30">
            <div data-nav-item data-hero className="text-[16px] font-bold text-foreground" style={{ fontFamily: pStyle.fontFamily }}>
              JustMy<span className="text-primary">Type</span>
            </div>
            <div className="hidden md:flex gap-8">
              {NAV_LINKS.map((item) => (
                <span key={item} data-nav-item data-hero className="text-[14px] text-muted-foreground" style={{ fontFamily: sStyle.fontFamily }}>
                  {item}
                </span>
              ))}
            </div>
            <button
              data-nav-item
              data-hero
              className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold"
              style={{ fontFamily: sStyle.fontFamily }}
            >
              Get Started
            </button>
          </nav>

          {/* Hero */}
          <section className="shrink-0 flex flex-col items-center text-center px-6 pt-24 pb-24 max-w-[720px] mx-auto">
            <span
              data-hero-eyebrow
              data-hero
              className="text-[12px] font-semibold tracking-[0.15em] uppercase text-primary mb-5"
              style={{ fontFamily: sStyle.fontFamily }}
            >
              Introducing v2.0
            </span>

            <h1
              key={headline}
              data-hero-title
              className="text-[clamp(36px,5.5vw,60px)] font-bold tracking-tight text-foreground leading-[1.08] mb-6 [text-wrap:balance]"
              style={pStyle}
            >
              {headline}
            </h1>

            <p
              data-hero-sub
              data-hero
              className="text-[clamp(15px,1.8vw,18px)] text-muted-foreground leading-relaxed max-w-[520px] mb-10"
              style={sStyle}
            >
              {SAMPLE.heroSub}
            </p>

            <div className="flex items-center gap-3">
              <button
                data-hero-cta
                data-hero
                className="h-11 px-6 rounded-full bg-primary text-primary-foreground text-[14px] font-semibold"
                style={{ fontFamily: sStyle.fontFamily }}
              >
                Start For Free
              </button>
              <button
                data-hero-cta
                data-hero
                className="h-11 px-6 rounded-full border border-border text-foreground text-[14px] font-semibold"
                style={{ fontFamily: sStyle.fontFamily }}
              >
                Learn More
              </button>
            </div>
          </section>

          {/* Features */}
          <section className="w-full border-t border-border px-6 md:px-10 py-20">
            <div data-scroll-in className="max-w-[600px] mx-auto text-center mb-16">
              <h2 className="text-[clamp(26px,3.5vw,34px)] font-bold text-foreground mb-4 tracking-tight" style={pStyle}>
                Built for modern teams
              </h2>
              <p className="text-[15px] text-muted-foreground leading-relaxed" style={sStyle}>
                Everything you need to manage your type system and ship faster.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-[820px] mx-auto">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div key={title} data-scroll-in className="flex flex-col items-start">
                  <Icon size={20} className="text-primary mb-4" strokeWidth={1.75} />
                  <h3 className="text-[16px] font-bold text-foreground mb-2" style={pStyle}>
                    {title}
                  </h3>
                  <p className="text-muted-foreground text-[14px] leading-relaxed" style={sStyle}>
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Testimonial */}
          <section className="w-full border-t border-border bg-muted/20 px-6 md:px-10 py-24">
            <blockquote
              data-scroll-in
              className="max-w-[680px] mx-auto text-center text-[22px] md:text-[26px] italic leading-snug text-foreground"
              style={sStyle}
            >
              &ldquo;{SAMPLE.quote}&rdquo;
            </blockquote>
            <div data-scroll-in className="mt-7 flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-[12px] shrink-0">
                JD
              </div>
              <div className="text-left leading-tight" style={{ fontFamily: sStyle.fontFamily }}>
                <div className="text-[13px] font-semibold text-foreground">Jamie Doyle</div>
                <div className="text-[12px] text-muted-foreground">Design Lead, Studio</div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="w-full border-t border-border px-6 md:px-10 py-24 text-center">
            <h2
              data-scroll-in
              className="text-[clamp(28px,4vw,40px)] font-bold text-foreground mb-5 tracking-tight leading-[1.1]"
              style={pStyle}
            >
              Ready to get started?
            </h2>
            <p
              data-scroll-in
              className="text-[15px] text-muted-foreground mb-8 max-w-[480px] mx-auto leading-relaxed"
              style={sStyle}
            >
              Join thousands of designers already building with better type.
            </p>
            <button
              data-scroll-in
              className="h-12 px-8 rounded-full bg-primary text-primary-foreground text-[15px] font-semibold"
              style={{ fontFamily: sStyle.fontFamily }}
            >
              Start 14-day free trial
            </button>
          </section>

          {/* Footer */}
          <footer className="w-full border-t border-border px-6 md:px-10 py-14">
            <div data-scroll-in className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 max-w-[900px] mx-auto">
              <div className="col-span-2 flex flex-col">
                <span className="text-[15px] font-bold text-foreground mb-3" style={pStyle}>
                  JustMy<span className="text-primary">Type</span>
                </span>
                <p className="text-muted-foreground text-[13px] leading-relaxed max-w-[280px]" style={sStyle}>
                  Find the perfect pair for your next project.
                </p>
              </div>

              {[
                { title: 'Product', links: ['Features', 'Pricing', 'Changelog'] },
                { title: 'Company', links: ['About', 'Blog', 'Contact'] },
              ].map((col) => (
                <div key={col.title} className="flex flex-col gap-3" style={{ fontFamily: sStyle.fontFamily }}>
                  <h4 className="text-[12px] font-bold text-foreground tracking-wider uppercase">{col.title}</h4>
                  {col.links.map((link) => (
                    <span key={link} className="text-[13px] text-muted-foreground">{link}</span>
                  ))}
                </div>
              ))}
            </div>
            <div
              className="max-w-[900px] mx-auto pt-6 border-t border-border/60 text-muted-foreground text-[12px] text-center"
              style={sStyle}
            >
              © 2026 JustMyType. All rights reserved.
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
