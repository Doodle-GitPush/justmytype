# JustMyType

A font-pairing playground. Pick two typefaces from ~1,900 Google Fonts, preview
them in real layouts, tune size/weight/leading/tracking, and copy the CSS out.

## Preview modes

| Mode | What it shows |
|---|---|
| **Focus** | Big centered display type — the default view, built to show the pairing itself |
| **Article** | Long-form editorial layout — heading, lead, body, pull quote, lists |
| **Hero** | A full marketing page inside a browser mockup, with scroll-driven sections |
| **Specimen** | Side-by-side alphabet, numerals and punctuation for both faces |

## Motion

Animation is GSAP throughout, via a small shared layer:

- `src/lib/gsap.js` — plugin registration plus the house easing/duration scale,
  so everything moves with one voice.
- `src/hooks/useTypeReveal.js` — `SplitText`-driven line/word/char reveals.
  Uses `autoSplit`, so headings re-split when a webfont swaps in and line breaks
  are measured against the real font rather than the fallback.
- `src/components/motion/Presence.jsx` — mount/unmount with an exit animation.
- `ScrollTrigger` drives the below-the-fold sections in the Hero mockup.

Every animation checks `prefers-reduced-motion` and degrades to a static layout.

> **Working on animations?** Build tweens *synchronously* inside `useGSAP` so its
> context owns them. Creating them in an async callback escapes that context, and
> a later revert strands elements at their `from` state. Any node handed to
> `SplitText` also needs a React `key` tied to its text — SplitText replaces the
> node's children, so React can't reconcile a text change against it.

## Keyboard shortcuts

`Space` new pair · `L`/`K` lock primary/secondary · `D` dark mode ·
`1`–`4` preview modes · `?` shortcuts · `Esc` close

## Local development

```bash
npm install
npm run dev      # vite dev server
npm run lint     # eslint — must pass clean
npm run build    # production build
```

## Font data

`public/font-metadata.json` holds family, category, available weights and italic
support for every family in the picker. It drives the filters, the weight
controls (which only offer weights a family actually ships), the generic CSS
fallback, and the Google Fonts request axis — so a single-weight family isn't
asked for six weights it doesn't have.

`Wanted Sans` is self-hosted from `public/fonts/` and deliberately excluded from
Google Fonts requests.

## Stack

React 19 · Vite 7 · Tailwind v4 (CSS-first `@theme`) · shadcn/Radix · GSAP 3
