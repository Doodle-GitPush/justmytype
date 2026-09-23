import { SAMPLE } from '../data/content';
import { TABS } from '../data/constants';

// atob/btoa only handle Latin1 — escape/unescape round-trips arbitrary
// UTF-8 (custom sample text, accented font names) through that safely.
// The -/_ swap and stripped padding make the result usable directly as a
// URL query value with no further percent-encoding.
const toBase64Url = (str) =>
  btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (str) => {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const withPadding = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  return decodeURIComponent(escape(atob(withPadding)));
};

const controlsToArray = (c) => [c.size, c.weight, c.lh, c.ls];
const controlsFromArray = (a) =>
  Array.isArray(a) && a.length === 4 ? { size: a[0], weight: a[1], lh: a[2], ls: a[3] } : null;

// Only well-formed 4-letter tags with the right value type survive a
// round-trip through someone else's hands.
const pickTags = (obj, type) => {
  if (!obj || typeof obj !== 'object') return undefined;
  const out = {};
  for (const [tag, v] of Object.entries(obj)) {
    if (/^[A-Za-z0-9]{4}$/.test(tag) && typeof v === type) out[tag] = v;
  }
  return Object.keys(out).length ? out : undefined;
};

const withExtras = (controls, axes, features) => {
  const next = { ...controls };
  const a = pickTags(axes, 'number');
  const f = pickTags(features, 'boolean');
  if (a) next.axes = a;
  if (f) next.features = f;
  return next;
};

/** Builds a URL that reproduces the given pairing + controls for whoever opens it. */
export function buildShareUrl({ primaryFont, primaryControls, secondaryFont, secondaryControls, bodyLineHeight, sampleText, activeTab }) {
  const payload = {
    pf: primaryFont,
    pc: controlsToArray(primaryControls),
    sf: secondaryFont,
    sc: controlsToArray(secondaryControls),
    blh: bodyLineHeight,
  };
  // Only carried along when they differ from the defaults a fresh visit
  // already starts with — keeps the common-case link shorter.
  // Axes and OpenType features ride along only when something is set.
  const nonEmpty = (o) => o && Object.keys(o).length > 0;
  if (nonEmpty(primaryControls.axes)) payload.pa = primaryControls.axes;
  if (nonEmpty(secondaryControls.axes)) payload.sa = secondaryControls.axes;
  if (nonEmpty(primaryControls.features)) payload.pft = primaryControls.features;
  if (nonEmpty(secondaryControls.features)) payload.sft = secondaryControls.features;
  if (sampleText && sampleText !== SAMPLE.title) payload.t = sampleText;
  if (activeTab && activeTab !== 'focus') payload.tab = activeTab;

  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('s', toBase64Url(JSON.stringify(payload)));
  return url.toString();
}

/** Reads a shared pairing out of the current URL, if there is one. Never throws. */
export function readShareState() {
  const encoded = new URLSearchParams(window.location.search).get('s');
  if (!encoded) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encoded));
    const state = {};
    if (typeof payload.pf === 'string') state.primaryFont = payload.pf;
    if (typeof payload.sf === 'string') state.secondaryFont = payload.sf;
    const pc = controlsFromArray(payload.pc);
    if (pc) state.primaryControls = withExtras(pc, payload.pa, payload.pft);
    const sc = controlsFromArray(payload.sc);
    if (sc) state.secondaryControls = withExtras(sc, payload.sa, payload.sft);
    if (typeof payload.blh === 'number') state.bodyLineHeight = payload.blh;
    if (typeof payload.t === 'string') state.sampleText = payload.t;
    if (TABS.some((t) => t.id === payload.tab)) state.activeTab = payload.tab;
    return state;
  } catch {
    // Malformed or tampered param — fall back to the normal defaults
    // rather than crashing the app over a bad link.
    return null;
  }
}
