# JustMyType — Improvement Roadmap

An audit of the current codebase (`c5eab8f`) with prioritised, concrete work items.
Findings marked **measured** were reproduced against a running build; findings marked
**unverified** need a check on real hardware before acting.

---

## Where the product stands

The app is in good shape structurally: clean component split, shadcn/Radix primitives,
Tailwind v4 with a proper token layer, four genuinely different preview modes, and a
1,926-family Google Fonts library behind category/weight/italic filters.

What holds it back is not missing features — it is that the two things a user does most
(**open the font picker** and **hit Generate**) are the two weakest paths in the app, and
that nothing a user creates can leave the tab. The list below is ordered by that reality.

---

## Tier 0 — Confirmed defects

### 1. The font picker takes ~7.4 seconds to open  *(measured)*

`FontSection` renders the entire filtered list into `<CommandItem>` nodes with no
virtualisation. With the full library that is **1,930 DOM nodes**, each carrying an inline
`fontFamily`, built synchronously on click.

```
dropdown open -> 1930 DOM items rendered, took 7409ms
```

Two of these components are mounted at once (primary + secondary), so the cost is paid twice.

**Fix.** Virtualise the list (`@tanstack/react-virtual` is ~3 KB and drops in under
`CommandList`), and cap the unfiltered render to the top N families until the user types.
Set `shouldFilter={false}` on `Command` and filter the array yourself — cmdk's built-in
fuzzy scorer walks all 1,930 items on every keystroke.

This is the single highest-impact change in the document.

### 2. Every font is downloaded twice  *(measured)*

`loadFont` and its `loadedFonts` de-dupe `Set` are copy-pasted into three modules —
`App.jsx:16`, `FontSection.jsx:24`, `FontInfoPanel.jsx:6`. Each keeps a *private* Set, so
the same family gets two identical `<link>` tags.

```
google font <link> tags after 10 generates: 44   (expected: 22)
duplicate hrefs: Plus Jakarta Sans ×2, Urbanist ×2, Winky Sans ×2, …
```

Worse, the tags accumulate forever — `<head>` grows unboundedly across a session, and
`FontInfoPanel` requests a *different* axis set (`ital,wght@0,300…1,400`) than the other
two, so some families get three stylesheets.

**Fix.** One `src/lib/fontLoader.js` exporting a single `loadFont`, backed by one Set.
While you are there, request only the weights the family actually publishes:

```js
// FONT_METADATA already carries this — 1,077 of 1,926 families ship a single weight
const meta = FONT_METADATA.find(m => m.family === name);
const axis = meta?.weights?.length ? `:wght@${meta.weights.join(';')}` : '';
```

### 3. `npm run lint` fails — 12 errors  *(measured)*

The lint script does not pass on a clean checkout, which means it cannot gate anything.
Most of it is misconfiguration rather than real bugs:

| Cause | Count | Real? |
|---|---|---|
| `motion` "unused" in every component | 6 | ❌ false positive — `eslint-plugin-react` is not installed, so JSX identifier usage is invisible to `no-unused-vars` |
| `module`/`require`/`__dirname` undefined in `tailwind.config.js`, `vite.config.js` | 3 | ❌ false positive — config files need `globals.node` |
| `fontListLength`, `currentValue`, `generateRandomPair` genuinely unused | 3 | ✅ real dead code |

**Fix.** Add `eslint-plugin-react` with `react/jsx-uses-vars`, add a config-files override
with Node globals, then delete the three genuinely unused bindings. After that, wire
`lint` + `build` into CI so it stays green.

### 4. Dead weight in the repo

| Item | Why it's dead |
|---|---|
| `src/App.css` | Vite template leftover, imported nowhere |
| `tailwind.config.js` | Tailwind v4 is configured CSS-first via `@theme` in `index.css`. This file is never read — and it uses `module.exports`/`require()` inside a `"type": "module"` package, so it would throw if anything did load it |
| `html2canvas` dependency | Superseded by `html-to-image`, still installed |
| `path` dependency | A Node polyfill shipped in a browser bundle; `vite.config.js` uses Node's built-in |
| `public/all-google-fonts.json` | 22 KB served to nobody — `font-metadata.json` is the one in use |
| `README.md` | Still the stock "React + Vite" template |
| `fontListLength` state (`App.jsx:67`) | Set on load, never read |
| `Wavehaus`, `Trap`, `Cabinet Grotesk` in `FONTS` | Not Google Fonts — confirmed `HTTP 400` from the CSS2 API. They are unselectable-but-listed. (`Wanted Sans` is fine — it is self-hosted via `@font-face`.) |

---

## Tier 1 — Product gaps that cap the app's value

### 5. Nothing leaves the tab

There is no URL state and no persistence. A refresh destroys the pairing; there is no way
to send "look at this combination" to a colleague. For a pairing tool this is the most
valuable missing feature, and it is small:

```js
// ?p=Fraunces&s=Inter&pw=700&sw=400&lh=1.7&t=rose&d=1
```

Read on mount, write on change (debounced, `history.replaceState`). Add a "Copy link"
button next to "Copy CSS". Mirror the same state to `localStorage` so a plain refresh
survives too.

While you are there: dark mode should seed from `prefers-color-scheme` on first visit
instead of always starting light.

### 6. "Generate Pair" is random, not a pairing engine

`generateRandomPair` (`App.jsx:129`) draws two uniform-random indices from the pool. Across
1,926 families — 465 of them Display and 356 Handwriting — most draws are unusable, and
nothing prevents *Rubik* + *Rubik Vinyl* or two competing display faces.

This is the app's name and its core promise, and right now it is `Math.random()`.

A cheap heuristic gets most of the way, using metadata already on disk:

- Bias the **body** font to Sans Serif / Serif; never Display or Handwriting.
- Require the pair to differ in category (the classic serif ↔ sans contrast), or if same
  category, require different families with a real weight gap.
- Reject pairs sharing a family stem (`Noto Sans` / `Noto Serif`, `IBM Plex *`).
- Ensure the heading font actually ships a weight ≥ 600.

A curated set of ~40 hand-picked pairings, shuffled in alongside the generated ones, would
raise the perceived quality further for very little work.

### 7. Weight controls ignore what the font has

`FontSection` hard-codes the weight slider to `min={300} max={800} step={100}` for every
family. But **1,077 of 1,926 families ship exactly one weight**. Dragging to 800 on those
gives you a browser-synthesised faux bold, and the "Copy CSS" output then requests weights
Google will not serve.

**Fix.** Drive the slider (or better, a segmented control) from `meta.weights`. Same for
the generated CSS — emit only real weights, and use the font's actual category for the
fallback instead of the hard-coded `sans-serif`:

```js
font-family: 'Fraunces', sans-serif;   /* today, on a serif font */
```

### 8. No feedback while a font loads

Selecting or generating a font swaps the family name instantly while the webfont is still
in flight, so the preview sits in fallback type with no indication anything is happening.
On a rapid `Space`-mash the UI claims a pairing the user cannot see.

**Fix.** `await document.fonts.load(...)` and show a subtle skeleton/shimmer on the preview
until it resolves.

---

## Tier 2 — Reach, quality, confidence

### 9. `index.html` is bare

No `meta description`, no Open Graph or Twitter card, no `theme-color`, no canonical URL.
A link to this tool currently unfurls as a blank box on every social platform — for a
visual product that is a real cost.

Also missing, and worth a measurable paint improvement:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

An OG image generated from the current pairing would be an excellent later addition —
it makes every shared link an advert for the tool.

### 10. Accessibility

- The shortcuts overlay (`App.jsx:295`) and `FontInfoPanel` are hand-rolled `motion.div`s
  with no `role="dialog"`, no `aria-modal`, no focus trap, and no focus restoration on
  close. Radix's `Dialog` is already a dependency — routing both through it fixes all of
  this for free.
- Icon-only controls (mobile FAB, sidebar toggles, panel close buttons, accent swatches)
  have no accessible name; `title` is not a substitute for `aria-label`.
- `Escape` is handled in two competing places — `App.jsx:189` and `FontInfoPanel.jsx:47`.
- The global keydown handler calls `e.preventDefault()` on `Space` unconditionally, which
  kills space-to-scroll while reading the Article preview.
- Accent colours are applied as `--primary` without a contrast check; several
  swatch/foreground pairs should be verified against WCAG AA.

### 11. Bundle size

```
dist/assets/index-C8RaBilO.js   534.28 kB │ gzip: 169.10 kB   ⚠ over Vite's 500 kB warning
```

One chunk, everything eager. `framer-motion` and `html-to-image` are the bulk.
Lazy-load `html-to-image` inside `handleExportPng` (it is needed only on click), split
`FontInfoPanel` behind `React.lazy`, and set `manualChunks` for vendor code.

### 12. Export path — worth verifying

**Unverified — I could not test this properly.** This sandbox's browser never fetches font
binaries from `fonts.gstatic.com`, so *everything* renders in fallback type here and export
fidelity cannot be judged. Two things in `handleExportPng` (`App.jsx:233`) are worth a look
on a real machine:

- `skipFonts: true` tells `html-to-image` not to inline `@font-face` rules into the
  rasterised SVG. Whether the chosen fonts survive into the PNG depends on the browser
  reusing its font cache for the `foreignObject` render — **check that an exported PNG
  actually shows the selected pairing.**
- `toPng` is deliberately called **twice** ("first pass warms up the renderer"). That
  doubles export time and is a workaround for a root cause that is probably font or image
  readiness. If pass one is needed, the real fix is awaiting the specific families.

Independently of fonts: the export captures the scroll viewport, so a long Article preview
is **clipped mid-content**. Export should render the full scroll height.

Also replace `alert()` on failure with an inline toast, and add error handling around
`navigator.clipboard.writeText` in `handleCopyCss` — it rejects on insecure origins and
currently fails silently while still flashing "Copied!".

### 13. No tests, no CI

There is no test runner and no workflow. Given the app is largely visual, the highest
value per effort is:

- **Vitest** unit tests on the logic that actually has rules: the pairing engine, the
  filter predicate, CSS generation, URL encode/decode round-trip.
- **A GitHub Action** running `lint` + `build` on PRs (needs Tier 0 item 3 first).
- Optionally a Playwright smoke test: load, generate, open picker, export.

### 14. README

Replace the Vite boilerplate with what the project actually is: screenshot, feature list,
keyboard shortcuts, local setup, font-data provenance, licence.

---

## Suggested sequencing

**Sprint 1 — make the core fast and clean**
Items 1, 2, 3, 4. Roughly a day. Fixes the worst user-facing latency, halves font network
traffic, and gets the repo to a state where CI can protect it.

**Sprint 2 — make it worth sharing**
Items 5, 6, 7. This is where the product gets meaningfully better: shareable links,
pairings that are actually good, and controls that respect each font's real capabilities.

**Sprint 3 — reach and polish**
Items 8, 9, 10, 11, plus verifying 12.

**Ongoing**
Items 13, 14.

---

## Quick reference — verified measurements

| Metric | Value |
|---|---|
| Font families in library | 1,926 |
| Single-weight families | 1,077 (56%) |
| Category split | Sans 709 · Display 465 · Handwriting 356 · Serif 346 · Mono 50 |
| Font picker open time | 7,409 ms (1,930 DOM nodes) |
| Duplicate font stylesheet requests | 2× per family |
| Production bundle | 534 KB (169 KB gzip), single chunk |
| `npm run lint` | 12 errors, 1 warning |
| Non-Google fonts listed as selectable | 3 (`Wavehaus`, `Trap`, `Cabinet Grotesk`) |
