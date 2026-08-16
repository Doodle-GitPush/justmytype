import { useRef } from 'react';
import { gsap, useGSAP, SplitText, ScrollTrigger, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';
import { SAMPLE } from '../../data/content';
import { Button } from '@/components/ui/button';

const NAV_LINKS = ['Product', 'Resources', 'Customers', 'Pricing'];

export default function HeroPreview({ pStyle, sStyle, text, revealKey }) {
  const scope = useRef(null);
  const scroller = useRef(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(scope);

      if (prefersReducedMotion()) {
        gsap.set(q('[data-hero]'), { opacity: 1, y: 0, x: 0, rotateX: 0 });
        return;
      }

      // The frame tilts up into place, then the chrome settles in.
      const tl = gsap.timeline({ defaults: { ease: EASE.out } });
      tl.from(q('[data-frame]'), { rotateX: 18, y: 50, opacity: 0, duration: 0.9 })
        .from(q('[data-nav-item]'), { opacity: 0, y: -10, duration: DUR.base, stagger: 0.06 }, 0.3)
        .from(q('[data-hero-badge]'), { opacity: 0, scale: 0.9, duration: DUR.base }, 0.4)
        .from(q('[data-hero-sub]'), { opacity: 0, y: 20, duration: DUR.slow }, 0.7)
        .from(q('[data-hero-cta]'), { opacity: 0, y: 20, duration: DUR.slow, stagger: 0.08 }, 0.85);

      // `autoSplit` re-splits the headline once the webfont lands, so line
      // breaks are measured against the real font rather than the fallback.
      const split = SplitText.create(q('[data-hero-title]'), {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            opacity: 0,
            duration: DUR.type,
            ease: EASE.type,
            stagger: 0.1,
            delay: 0.45,
          }),
      });

      // Sections below the fold animate as the inner frame scrolls.
      q('[data-scroll-in]').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 30,
          duration: DUR.slow,
          ease: EASE.out,
          // `top bottom-=40` fires as soon as the element enters the scroller.
          // A percentage start (e.g. `top 92%`) never fires for a tall section
          // sitting at the very bottom, leaving it stranded at opacity 0.
          scrollTrigger: { trigger: el, scroller: scroller.current, start: 'top bottom-=40', once: true },
        });
      });

      // The mini bar chart grows on entry.
      q('[data-bar]').forEach((bar) => {
        gsap.from(bar, {
          scaleY: 0,
          transformOrigin: 'bottom center',
          duration: DUR.slow,
          ease: EASE.pop,
          scrollTrigger: { trigger: bar, scroller: scroller.current, start: 'top bottom-=20', once: true },
        });
      });

      // Trigger positions are measured at creation time, before the nested
      // mock-site has settled — without a refresh the last section's start can
      // be computed against a stale height and never fire. Fonts change the
      // layout again on arrival, so refresh on both.
      const settle = setTimeout(() => ScrollTrigger.refresh(), 400);
      document.fonts.ready.then(() => ScrollTrigger.refresh());

      return () => {
        clearTimeout(settle);
        split.revert();
      };
    },
    { scope, dependencies: [revealKey], revertOnUpdate: true }
  );

  const headline = text.length > 50 ? `${text.substring(0, 50)}…` : text || 'Crafting digital experiences with precision.';

  return (
    <div
      ref={scope}
      className="w-full max-w-[1000px] mx-auto flex flex-col items-center justify-start pb-10 px-0 lg:px-8 [perspective:2000px]"
    >
      <div
        data-frame
        data-hero
        className="w-full bg-background border border-border rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1),0_20px_40px_-20px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col relative"
      >
        {/* Mockup chrome */}
        <div className="h-12 bg-muted/40 border-b border-border flex items-center px-5 gap-2.5 shrink-0 backdrop-blur-md relative z-50">
          <span className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] shadow-sm" />
          <span className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] shadow-sm" />
          <span className="w-3.5 h-3.5 rounded-full bg-[#27c93f] shadow-sm" />
          <div className="mx-auto h-7 w-64 bg-background/60 rounded-lg border border-border/40 flex items-center justify-center shadow-inner">
            <span className="text-[10px] text-muted-foreground/60 font-medium">justmytype.com</span>
          </div>
        </div>

        {/* The mini site */}
        <div
          ref={scroller}
          className="relative w-full h-[650px] overflow-y-auto overflow-x-hidden bg-background flex flex-col scroll-smooth scrollbar-hide"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Navbar */}
          <nav className="flex items-center justify-between w-full py-4 px-8 md:px-12 bg-background/60 backdrop-blur-xl border-b border-border/40 sticky top-0 z-50">
            <div data-nav-item data-hero className="text-[20px] font-bold text-foreground shrink-0">
              <span className="font-light">Design</span>
              <span className="font-extrabold text-primary">System</span>.
            </div>
            <div className="hidden md:flex gap-10">
              {NAV_LINKS.map((item) => (
                <a
                  key={item}
                  data-nav-item
                  data-hero
                  href="#"
                  className="text-[14px] text-muted-foreground hover:text-foreground transition-colors font-medium relative group"
                  style={{ fontFamily: sStyle.fontFamily }}
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full rounded-full" />
                </a>
              ))}
            </div>
            <div data-nav-item data-hero>
              <Button
                className="rounded-full text-[13px] px-6 shadow-md hover:shadow-lg transition-all"
                style={{ fontFamily: sStyle.fontFamily }}
              >
                Get Started
              </Button>
            </div>
          </nav>

          {/* Hero */}
          <section className="shrink-0 flex flex-col items-center justify-center text-center px-6 md:px-10 relative w-full pt-28 pb-32">
            <div
              data-hero-badge
              data-hero
              className="text-[12px] font-semibold tracking-wide py-1.5 px-4 rounded-full bg-muted/50 text-foreground mb-8 border border-border/50 relative z-10 backdrop-blur-md flex items-center gap-2"
              style={{ fontFamily: sStyle.fontFamily }}
            >
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              Announcing our new component library v2.0
              <span className="text-muted-foreground ml-1">→</span>
            </div>

            <h1
              // SplitText owns this node's children; key it so a text change
              // remounts cleanly instead of reconciling against split spans.
              key={headline}
              data-hero-title
              className="text-[clamp(44px,6vw,72px)] font-extrabold text-foreground mb-8 max-w-[850px] leading-[1.05] tracking-tight relative z-10 [text-wrap:balance]"
              style={pStyle}
            >
              {headline}
            </h1>

            <p
              data-hero-sub
              className="text-[clamp(17px,2vw,22px)] text-muted-foreground mb-12 max-w-[650px] leading-relaxed relative z-10"
              style={sStyle}
            >
              {SAMPLE.heroSub} Stop struggling with generic interfaces and start shipping pixel-perfect designs instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 relative z-10">
              <Button
                data-hero-cta
                size="lg"
                className="px-10 h-14 rounded-full shadow-lg hover:-translate-y-1 transition-all text-[16px] font-semibold"
                style={{ fontFamily: sStyle.fontFamily }}
              >
                Start For Free
              </Button>
              <Button
                data-hero-cta
                size="lg"
                variant="secondary"
                className="px-10 h-14 rounded-full border border-border bg-card/50 hover:bg-card backdrop-blur-md transition-colors text-[16px] font-semibold"
                style={{ fontFamily: sStyle.fontFamily }}
              >
                Explore Templates
              </Button>
            </div>
          </section>

          {/* Bento features */}
          <section className="w-full relative z-20 bg-muted/20 border-t border-border/50 pt-24 pb-32 px-6 sm:px-12 flex flex-col items-center">
            <div data-scroll-in className="max-w-[700px] mx-auto text-center mb-16">
              <h2 className="text-[clamp(32px,5vw,48px)] font-bold text-foreground mb-6 tracking-tight" style={pStyle}>
                Built for modern teams
              </h2>
              <p className="text-[clamp(16px,2vw,18px)] text-muted-foreground leading-relaxed" style={sStyle}>
                Everything you need to manage your components, collaborate with your team, and ship faster than ever before.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1000px] mx-auto w-full">
              <div
                data-scroll-in
                className="md:col-span-2 bg-card rounded-2xl border border-border p-8 flex flex-col justify-between overflow-hidden relative group hover:border-primary/30 transition-colors shadow-sm"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-20 -mt-20 transition-all group-hover:bg-primary/20" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                    <div className="w-5 h-5 bg-primary rounded-md" />
                  </div>
                  <h3 className="text-[22px] font-bold text-foreground mb-3" style={pStyle}>
                    {SAMPLE.cardTitles[0]}
                  </h3>
                  <p className="text-muted-foreground text-[15px] leading-relaxed max-w-[400px]" style={sStyle}>
                    {SAMPLE.cardBodies[0]}
                  </p>
                </div>
              </div>

              <div
                data-scroll-in
                className="bg-card rounded-2xl border border-border p-8 flex flex-col relative overflow-hidden hover:border-secondary/30 transition-colors shadow-sm"
              >
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-[50px]" />
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-6 border border-secondary/20">
                  <div className="w-4 h-4 border-2 border-secondary rounded-full" />
                </div>
                <h3 className="text-[22px] font-bold text-foreground mb-3" style={pStyle}>
                  {SAMPLE.cardTitles[1]}
                </h3>
                <p className="text-muted-foreground text-[15px] leading-relaxed" style={sStyle}>
                  {SAMPLE.cardBodies[1]}
                </p>
              </div>

              <div
                data-scroll-in
                className="bg-card rounded-2xl border border-border p-8 flex flex-col relative overflow-hidden hover:border-emerald-500/30 transition-colors shadow-sm"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px]" />
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
                  <div className="w-4 h-4 bg-emerald-500 rotate-45" />
                </div>
                <h3 className="text-[22px] font-bold text-foreground mb-3" style={pStyle}>
                  {SAMPLE.cardTitles[2]}
                </h3>
                <p className="text-muted-foreground text-[15px] leading-relaxed" style={sStyle}>
                  {SAMPLE.cardBodies[2]}
                </p>
              </div>

              <div
                data-scroll-in
                className="md:col-span-2 bg-card rounded-2xl border border-border p-8 flex flex-col justify-between overflow-hidden relative group hover:border-blue-500/30 transition-colors shadow-sm"
              >
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
                <div className="relative z-20">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <div className="w-6 h-2 bg-blue-500 rounded-full" />
                    </div>
                    <h3 className="text-[22px] font-bold text-foreground" style={pStyle}>
                      Advanced Analytics
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-[15px] leading-relaxed max-w-[500px]" style={sStyle}>
                    Gain deep insights into how your team uses the design system. Track adoption, measure efficiency, and
                    identify areas for improvement seamlessly.
                  </p>
                </div>
                <div className="absolute bottom-6 right-10 flex items-end gap-2.5 opacity-30 group-hover:opacity-70 transition-opacity z-0 duration-500">
                  {[50, 80, 45, 110, 75, 140].map((h, i) => (
                    <div key={i} data-bar className="w-8 bg-blue-500/80 rounded-t-sm" style={{ height: h }} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="w-full relative z-20 bg-primary/95 text-primary-foreground py-24 px-6 sm:px-12 flex flex-col items-center">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="max-w-[800px] mx-auto text-center relative z-10 flex flex-col items-center w-full">
              <h2
                data-scroll-in
                className="text-[clamp(36px,5vw,56px)] font-extrabold mb-6 tracking-tight leading-[1.1]"
                style={pStyle}
              >
                Ready to transform your workflow?
              </h2>
              <p
                data-scroll-in
                className="text-[clamp(16px,2vw,20px)] text-primary-foreground/80 mb-10 max-w-[600px] leading-relaxed"
                style={sStyle}
              >
                Join thousands of designers and developers who are already building better products, faster.
              </p>
              <div data-scroll-in className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button
                  className="h-14 px-8 rounded-full bg-background text-foreground text-[16px] font-bold shadow-xl hover:scale-105 transition-transform shrink-0"
                  style={{ fontFamily: sStyle.fontFamily }}
                >
                  Start 14-day free trial
                </button>
                <button
                  className="h-14 px-8 rounded-full bg-black/20 text-white text-[16px] font-bold border border-white/20 hover:bg-black/30 transition-colors backdrop-blur-md shrink-0"
                  style={{ fontFamily: sStyle.fontFamily }}
                >
                  Talk to Sales
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="w-full bg-card border-t border-border pt-20 pb-10 px-10 md:px-16 relative z-20 flex flex-col">
            <div data-scroll-in className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
              <div className="col-span-2 flex flex-col">
                <span className="text-[24px] font-bold text-foreground mb-6">
                  <span className="font-light">Design</span>
                  <span className="font-extrabold text-primary">System</span>.
                </span>
                <p className="text-muted-foreground text-[15px] leading-relaxed max-w-[300px] mb-8" style={sStyle}>
                  The most powerful component library and design system management platform on the web.
                </p>
              </div>

              {[
                { title: 'Product', links: ['Features', 'Integrations', 'Pricing', 'Changelog', 'Docs'] },
                { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Contact', 'Partners'] },
                { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie', 'Security'] },
              ].map((col) => (
                <div key={col.title} className="flex flex-col gap-4" style={{ fontFamily: sStyle.fontFamily }}>
                  <h4 className="text-[14px] font-bold text-foreground tracking-wider uppercase mb-2">{col.title}</h4>
                  {col.links.map((link) => (
                    <a key={link} href="#" className="text-[14px] text-muted-foreground hover:text-primary transition-colors">
                      {link}
                    </a>
                  ))}
                </div>
              ))}
            </div>
            <div
              className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border/50 text-muted-foreground text-[14px]"
              style={sStyle}
            >
              <p>© 2026 DesignSystem Inc. All rights reserved.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> All systems operational
                </span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
