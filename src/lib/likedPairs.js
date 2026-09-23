import { useSyncExternalStore } from 'react';
import { metaFor } from './pairing';

/**
 * Pairs the user liked in Type Match, plus the ones they passed on — kept
 * in localStorage so the list and the taste profile survive reloads.
 */

const KEY = 'jmt:liked:v1';

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* storage unavailable */ }
  return { liked: [], passed: [] };
};

let state = load();
const listeners = new Set();
const commit = (next) => {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  listeners.forEach((l) => l());
};

export const likePair = (heading, body) =>
  commit({
    ...state,
    liked: [{ heading, body, at: Date.now() }, ...state.liked.filter((p) => !(p.heading === heading && p.body === body))].slice(0, 200),
  });

export const passPair = (heading, body) =>
  commit({ ...state, passed: [{ heading, body }, ...state.passed].slice(0, 400) });

export const removeLiked = (heading, body) =>
  commit({ ...state, liked: state.liked.filter((p) => !(p.heading === heading && p.body === body)) });

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
export const useLikedPairs = () => useSyncExternalStore(subscribe, () => state);

const kind = (family) => {
  const m = metaFor(family);
  if (!m) return 'custom';
  if (m.category === 'Sans Serif') return 'sans';
  if (m.category === 'Serif') return m.stroke === 'Slab Serif' ? 'slab serif' : 'serif';
  if (m.category === 'Monospace') return 'mono';
  if (m.category === 'Handwriting') return 'script';
  return 'display';
};

/** A one-line read of what the user tends to like, or null until there's enough data. */
export function tasteProfile({ liked, passed }) {
  if (liked.length < 3) return null;
  const tally = new Map();
  for (const p of liked) {
    const key = `${kind(p.heading)} headlines with ${kind(p.body)} body text`;
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }
  const [top, n] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
  const rate = Math.round((liked.length / Math.max(1, liked.length + passed.length)) * 100);
  const pickiness = rate < 25 ? 'Picky' : rate > 65 ? 'Easy to please' : 'Discerning';
  return `You lean towards ${top} (${n} of ${liked.length} likes). ${pickiness} — you like ${rate}% of what you see.`;
}
