import { useEffect, useRef, useState } from 'react';
import { Check, Clock, Users, Flame, Home, Search, Bell, User, MapPin, Mail, Phone, Globe } from 'lucide-react';
import { gsap, useGSAP, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';
import { faceOf } from '../../lib/typeStyles';
import { track } from '../../lib/achievements';
import { cn } from '@/lib/utils';

/**
 * Real-world layouts to judge a pairing in context — the places a pair
 * actually ends up, at the sizes it actually gets set at. Sizes are the
 * template's own (a business card can't take a 96px heading); the faces,
 * weights, tracking, axes and features all come from the user's controls.
 */

const LAYOUTS = [
  { id: 'pricing', label: 'Pricing' },
  { id: 'app', label: 'Mobile app' },
  { id: 'card', label: 'Business card' },
  { id: 'poster', label: 'Event poster' },
  { id: 'recipe', label: 'Recipe' },
  { id: 'email', label: 'Newsletter' },
  { id: 'book', label: 'Book cover' },
];

function Pricing({ h, b }) {
  const tiers = [
    { name: 'Starter', price: '0', blurb: 'For side projects and first drafts.', features: ['3 projects', 'Community support', 'Basic exports'] },
    { name: 'Studio', price: '24', blurb: 'For designers shipping every week.', features: ['Unlimited projects', 'Priority support', 'Brand kits', 'Team comments'], featured: true },
    { name: 'Agency', price: '79', blurb: 'For teams running many brands.', features: ['Everything in Studio', 'SSO & roles', 'Client portals'] },
  ];
  return (
    <div className="w-full max-w-[980px] mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-[clamp(28px,4vw,44px)] leading-[1.1] text-foreground mb-3" style={h}>Simple pricing, no surprises</h2>
        <p className="text-[16px] text-muted-foreground max-w-[520px] mx-auto leading-relaxed" style={b}>Start free and upgrade when your work outgrows it. Every plan includes the full type library.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((t) => (
          <div
            key={t.name}
            data-layout-item
            className={cn(
              'rounded-2xl border p-6 flex flex-col',
              t.featured ? 'bg-foreground text-background border-foreground shadow-xl md:-translate-y-2' : 'bg-card border-border'
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[18px]" style={h}>{t.name}</span>
              {t.featured && <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground" style={b}>Popular</span>}
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-[44px] leading-none" style={h}>${t.price}</span>
              <span className={cn('text-[14px]', t.featured ? 'opacity-70' : 'text-muted-foreground')} style={b}>/month</span>
            </div>
            <p className={cn('text-[14px] mb-5 leading-relaxed', t.featured ? 'opacity-80' : 'text-muted-foreground')} style={b}>{t.blurb}</p>
            <ul className="flex flex-col gap-2 mb-6 flex-1">
              {t.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[14px]" style={b}>
                  <Check size={14} className="text-primary shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button className={cn('h-11 rounded-xl text-[14px]', t.featured ? 'bg-primary text-primary-foreground' : 'border border-border text-foreground')} style={{ ...b, fontWeight: 600 }}>
              Choose {t.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileApp({ h, b }) {
  const items = [
    { title: 'Morning pages', meta: '12 min read · Journal', tone: 'bg-amber-200/70' },
    { title: 'The slow web manifesto', meta: '8 min read · Essays', tone: 'bg-sky-200/70' },
    { title: 'Notes on kerning', meta: '5 min read · Craft', tone: 'bg-rose-200/70' },
  ];
  return (
    <div className="mx-auto w-[340px] max-w-full rounded-[44px] border-[10px] border-foreground/90 bg-background shadow-2xl overflow-hidden" data-layout-item>
      <div className="h-7 flex items-center justify-between px-6 text-[11px] text-foreground" style={b}>
        <span style={{ fontWeight: 600 }}>9:41</span>
        <span className="w-20 h-5 rounded-full bg-foreground/90" />
        <span>100%</span>
      </div>
      <div className="px-5 pt-4 pb-3">
        <div className="text-[13px] text-muted-foreground" style={b}>Good morning, Ada</div>
        <div className="text-[30px] leading-[1.1] text-foreground mt-1" style={h}>Today’s reading</div>
      </div>
      <div className="px-5 flex gap-2 pb-4 overflow-hidden">
        {['For you', 'Craft', 'Essays', 'Tools'].map((c, i) => (
          <span key={c} className={cn('text-[12px] px-3 py-1.5 rounded-full whitespace-nowrap', i === 0 ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground')} style={b}>{c}</span>
        ))}
      </div>
      <div className="mx-5 rounded-3xl bg-primary text-primary-foreground p-5 mb-4">
        <div className="text-[11px] uppercase tracking-widest opacity-80" style={b}>Featured</div>
        <div className="text-[22px] leading-tight mt-2" style={h}>Why every letter has a shadow</div>
        <div className="text-[13px] opacity-85 mt-2 leading-snug" style={b}>A short history of optical overshoot and the ink traps you never noticed.</div>
      </div>
      <div className="px-5 flex flex-col gap-3 pb-5">
        {items.map((it) => (
          <div key={it.title} className="flex items-center gap-3">
            <div className={cn('w-12 h-12 rounded-2xl shrink-0', it.tone)} />
            <div className="min-w-0">
              <div className="text-[15px] text-foreground truncate" style={h}>{it.title}</div>
              <div className="text-[12px] text-muted-foreground" style={b}>{it.meta}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border flex items-center justify-around py-3 text-muted-foreground">
        {[Home, Search, Bell, User].map((Icon, i) => <Icon key={i} size={20} className={i === 0 ? 'text-primary' : undefined} />)}
      </div>
    </div>
  );
}

function BusinessCard({ h, b }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-center justify-center" style={{ perspective: 1200 }}>
      <div data-layout-item className="w-[380px] max-w-full aspect-[1.75] rounded-xl bg-foreground text-background p-7 flex flex-col justify-between shadow-2xl">
        <div className="text-[13px] tracking-[0.3em] uppercase opacity-70" style={b}>Studio</div>
        <div>
          <div className="text-[34px] leading-none" style={h}>Northwind</div>
          <div className="text-[13px] opacity-70 mt-2" style={b}>Type & identity for curious brands</div>
        </div>
      </div>
      <div data-layout-item className="w-[380px] max-w-full aspect-[1.75] rounded-xl bg-card border border-border p-7 flex flex-col justify-between shadow-xl">
        <div>
          <div className="text-[22px] leading-tight text-foreground" style={h}>Mara Okafor</div>
          <div className="text-[13px] text-primary mt-1" style={b}>Lead Type Designer</div>
        </div>
        <div className="flex flex-col gap-1.5 text-[12px] text-muted-foreground" style={b}>
          <span className="flex items-center gap-2"><Mail size={12} /> mara@northwind.studio</span>
          <span className="flex items-center gap-2"><Phone size={12} /> +44 20 7946 0321</span>
          <span className="flex items-center gap-2"><Globe size={12} /> northwind.studio</span>
        </div>
      </div>
    </div>
  );
}

function EventPoster({ h, b, text }) {
  return (
    <div data-layout-item className="mx-auto w-[440px] max-w-full aspect-[3/4] rounded-md bg-primary text-primary-foreground p-8 flex flex-col shadow-2xl overflow-hidden relative">
      <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-primary-foreground/10" />
      <div className="flex justify-between text-[12px] uppercase tracking-[0.25em] relative" style={b}>
        <span>Vol. 07</span><span>Live</span>
      </div>
      <div className="flex-1 flex items-center relative">
        <div className="text-[clamp(40px,7vw,68px)] leading-[0.95] [text-wrap:balance] break-words" style={h}>{text}</div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-[13px] border-t border-primary-foreground/30 pt-4 relative" style={b}>
        <div><div className="opacity-70 text-[11px] uppercase tracking-widest">When</div>Fri 14 Nov · 8pm</div>
        <div><div className="opacity-70 text-[11px] uppercase tracking-widest">Where</div>The Letterpress Hall</div>
      </div>
    </div>
  );
}

function Recipe({ h, b }) {
  return (
    <div data-layout-item className="mx-auto w-full max-w-[760px] rounded-2xl bg-card border border-border overflow-hidden shadow-lg grid md:grid-cols-[1fr_1.3fr]">
      <div className="bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 min-h-[200px]" />
      <div className="p-7">
        <div className="text-[12px] uppercase tracking-widest text-primary mb-2" style={b}>Weeknight</div>
        <h2 className="text-[32px] leading-[1.1] text-foreground mb-3" style={h}>Charred corn & chilli pasta</h2>
        <div className="flex gap-4 text-[13px] text-muted-foreground mb-5" style={b}>
          <span className="flex items-center gap-1.5"><Clock size={13} /> 25 min</span>
          <span className="flex items-center gap-1.5"><Users size={13} /> Serves 4</span>
          <span className="flex items-center gap-1.5"><Flame size={13} /> Medium</span>
        </div>
        <div className="text-[15px] text-foreground mb-2" style={h}>Ingredients</div>
        <ul className="text-[14px] text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 mb-5" style={b}>
          {['400g rigatoni', '3 ears of corn', '1 red chilli', '2 cloves garlic', '50g parmesan', '1 lime'].map((i) => <li key={i}>· {i}</li>)}
        </ul>
        <div className="text-[15px] text-foreground mb-2" style={h}>Method</div>
        <ol className="text-[14px] text-muted-foreground leading-relaxed list-decimal pl-4 flex flex-col gap-1" style={b}>
          <li>Char the corn in a dry pan until blistered, then slice off the kernels.</li>
          <li>Soften garlic and chilli in olive oil; add corn and a splash of pasta water.</li>
          <li>Toss through the pasta with parmesan and a squeeze of lime.</li>
        </ol>
      </div>
    </div>
  );
}

function Newsletter({ h, b }) {
  return (
    <div className="mx-auto w-full max-w-[620px] rounded-xl border border-border bg-muted/40 p-3 sm:p-5">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-3 px-1" style={b}>
        <Mail size={13} /> <span className="truncate">From: <span className="text-foreground">The Kerning Club</span> · Issue #42</span>
      </div>
      <div data-layout-item className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-border text-center">
          <div className="text-[12px] tracking-[0.3em] uppercase text-muted-foreground" style={b}>The Kerning Club</div>
          <div className="text-[36px] leading-tight text-foreground mt-2" style={h}>Letters, weekly.</div>
        </div>
        <div className="px-8 py-6">
          <h3 className="text-[22px] leading-snug text-foreground mb-2" style={h}>The comeback of the ink trap</h3>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-4" style={b}>
            Once a fix for spreading ink on cheap paper, ink traps are showing up in screen fonts again — this time as pure style. We look at five new releases that wear them proudly.
          </p>
          <button className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-[14px]" style={{ ...b, fontWeight: 600 }}>Read the issue</button>
        </div>
        <div className="px-8 py-4 bg-muted/50 text-[12px] text-muted-foreground flex items-center gap-2" style={b}>
          <MapPin size={12} /> Sent from a very small studio · Unsubscribe
        </div>
      </div>
    </div>
  );
}

function BookCover({ h, b, text }) {
  return (
    <div className="flex items-end justify-center gap-6">
      <div data-layout-item className="w-[300px] max-w-[70vw] aspect-[2/3] rounded-r-md rounded-l-sm bg-[#1d2a3a] text-[#f4ead8] shadow-2xl p-7 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/25" />
        <div className="text-[11px] tracking-[0.35em] uppercase text-[#e9b872]" style={b}>A Novel</div>
        <div className="text-[clamp(28px,4vw,40px)] leading-[1.05] [text-wrap:balance] break-words" style={h}>{text}</div>
        <div>
          <div className="w-10 h-px bg-[#e9b872] mb-3" />
          <div className="text-[14px] tracking-widest uppercase" style={b}>Imogen Hale</div>
        </div>
      </div>
      <div data-layout-item className="hidden sm:flex w-[46px] aspect-[46/450] bg-[#1d2a3a] text-[#f4ead8] rounded-sm shadow-xl items-center justify-center">
        <div className="-rotate-90 whitespace-nowrap text-[12px] tracking-[0.25em] uppercase" style={b}>Imogen Hale</div>
      </div>
    </div>
  );
}

const VIEWS = { pricing: Pricing, app: MobileApp, card: BusinessCard, poster: EventPoster, recipe: Recipe, email: Newsletter, book: BookCover };

const readLayout = () => {
  try { return localStorage.getItem('jmt:layout') || 'pricing'; } catch { return 'pricing'; }
};

export default function LayoutsPreview({ pStyle, sStyle, text, revealKey }) {
  const [layout, setLayout] = useState(readLayout);
  const scope = useRef(null);

  useEffect(() => {
    try { localStorage.setItem('jmt:layout', layout); } catch { /* storage unavailable */ }
    track('layout', { id: layout });
  }, [layout]);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(gsap.utils.selector(scope)('[data-layout-item]'), {
        opacity: 0, y: 18, duration: DUR.base, ease: EASE.out, stagger: 0.06,
      });
    },
    { scope, dependencies: [layout, revealKey], revertOnUpdate: true }
  );

  // Heading and body faces, with the user's weight/tracking/axes/features
  // but the template's own sizes and leading.
  const h = { ...faceOf(pStyle), fontWeight: pStyle.fontWeight, letterSpacing: pStyle.letterSpacing };
  const b = { ...faceOf(sStyle), fontWeight: sStyle.fontWeight, letterSpacing: sStyle.letterSpacing };
  const View = VIEWS[layout] ?? Pricing;

  return (
    <div className="w-full flex flex-col gap-6 pb-44 lg:pb-6">
      {/* One segmented strip — scrolls sideways on narrow screens instead of wrapping into a ragged pile. */}
      <div className="-mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto scrollbar-hide flex lg:justify-center">
        <div role="tablist" aria-label="Layout" className="inline-flex shrink-0 p-1 gap-0.5 bg-muted rounded-full">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              role="tab"
              aria-selected={layout === l.id}
              onClick={() => setLayout(l.id)}
              className={cn(
                'whitespace-nowrap text-[12px] px-3.5 py-1.5 rounded-full font-medium transition-all',
                layout === l.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <div ref={scope} key={layout} className="flex-1 flex items-center justify-center px-1">
        <View h={h} b={b} text={text} />
      </div>
    </div>
  );
}
