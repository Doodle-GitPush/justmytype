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
| **Compare** | Audition candidate fonts against the current pair |
| **Layouts** | The pair in real contexts — pricing page, mobile app, business card, event poster, recipe, newsletter, book cover |
| **Glyphs** | Every character either font draws, grouped by script, with copyable Unicode/HTML/CSS/JS escapes |

## Generate Pair

`src/lib/pairing.js` picks with intent rather than at random: the heading and
body have separate roles, picks lean towards popular families, the two faces
must come from different families and (usually) contrast in structure, and ~40
hand-picked pairings are mixed in. A **mood** (Any, Editorial, Tech, Playful,
Luxury, Retro) in the Tune panel narrows each role.

## Font controls

Each font's controls cover size, weight, line height and tracking, plus its
**variable axes** (optical size, width, slant, and custom axes such as
Fraunces' SOFT/WONK) and **OpenType features** (ligatures, small caps,
old-style/tabular numerals, fractions, swashes, stylistic sets…). Both apply in
every preview, are included in Copy CSS, and survive share links.

## Studio

The **Studio** button beside the dock opens full-screen modes:

| Mode | What it does |
|---|---|
| **Animate** | Twelve continuous kinetic effects with tunable parameters; export MP4/WebM, GIF or a PNG still |
| **Poster** | Layered free layout — drag, rotate, outline and blend text over solid, gradient or image backgrounds; PNG export |
| **Letter Lab** | Generative patterns from glyphs — grid, radial, wave, word masks, echo, scatter; PNG export |
| **Kern Game** | Space a word's letters by eye, scored against the font's own kerning |
| **Type Match** | Swipe on pairings; likes are saved and build a taste profile |
| **Achievements** | Badges for exploring, tracked locally in the browser |

Exports are drawn onto a canvas from the live layout (see
`src/lib/motionExport.js`, `src/lib/posterRender.js`, `src/lib/letterLab.js`),
so they use the real webfonts. Canvas text can't take variable-axis or
OpenType settings, so exports use each font's defaults for those.

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
`1`–`7` preview modes · `?` shortcuts · `Esc` close

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

`npm run fonts:enrich` adds variable axes, a popularity rank, stroke
classification, script subsets and primary script from Google Fonts' own
catalogue — these drive the pairing engine, axis controls and glyph explorer.

`Wanted Sans` is self-hosted from `public/fonts/` and deliberately excluded from
Google Fonts requests.

## Stack

React 19 · Vite 7 · Tailwind v4 (CSS-first `@theme`) · shadcn/Radix · GSAP 3
