import { useSyncExternalStore } from 'react';

/**
 * Achievements — a tiny local event log. Features call `track(event)`;
 * this module keeps counts (and a few "distinct things seen" sets) in
 * localStorage, checks every achievement after each event, and tells
 * subscribers about anything newly unlocked so the app can celebrate.
 *
 * Nothing leaves the browser, and every storage access is guarded — in a
 * private window it all still works, it just forgets on reload.
 */

const KEY = 'jmt:achievements:v1';

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* storage unavailable */ }
  return { counts: {}, sets: {}, best: {}, unlocked: {} };
};

let state = load();
const listeners = new Set();
const unlockListeners = new Set();

const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
};

const count = (s, k) => s.counts[k] ?? 0;
const setSize = (s, k) => s.sets[k]?.length ?? 0;
const best = (s, k) => s.best[k] ?? 0;

/**
 * Each achievement reports progress as [current, goal]; it unlocks when
 * current reaches goal. Keeping it numeric lets the panel draw progress bars.
 */
export const ACHIEVEMENTS = [
  { id: 'first-pair', title: 'First Date', desc: 'Generate your first pair', progress: (s) => [count(s, 'generate'), 1] },
  { id: 'pairs-50', title: 'Serial Pairer', desc: 'Generate 50 pairs', progress: (s) => [count(s, 'generate'), 50] },
  { id: 'pairs-250', title: 'Pairing Machine', desc: 'Generate 250 pairs', progress: (s) => [count(s, 'generate'), 250] },
  { id: 'fonts-100', title: 'Font Tourist', desc: 'Meet 100 different families', progress: (s) => [setSize(s, 'fonts'), 100] },
  { id: 'fonts-500', title: 'Globetrotter', desc: 'Meet 500 different families', progress: (s) => [setSize(s, 'fonts'), 500] },
  { id: 'moods', title: 'Mood Swings', desc: 'Generate in every mood', progress: (s) => [setSize(s, 'moods'), 6] },
  { id: 'axis', title: 'Variable Voyager', desc: 'Bend a variable font axis', progress: (s) => [Math.min(1, count(s, 'axis')), 1] },
  { id: 'features', title: 'Feature Creature', desc: 'Toggle 5 different OpenType features', progress: (s) => [setSize(s, 'features'), 5] },
  { id: 'layouts', title: 'Layout Hopper', desc: 'Try every realistic layout', progress: (s) => [setSize(s, 'layouts'), 7] },
  { id: 'glyphs', title: 'Glyph Hunter', desc: 'Copy 10 glyphs', progress: (s) => [count(s, 'glyph-copy'), 10] },
  { id: 'effects', title: 'In Motion', desc: 'Try every animation effect', progress: (s) => [setSize(s, 'effects'), 10] },
  { id: 'motion-export', title: "Director's Cut", desc: 'Export a motion clip', progress: (s) => [count(s, 'motion-export'), 1] },
  { id: 'poster', title: 'Poster Child', desc: 'Export a poster', progress: (s) => [count(s, 'poster-export'), 1] },
  { id: 'lab', title: 'Mad Typographer', desc: 'Export a Letter Lab piece', progress: (s) => [count(s, 'lab-export'), 1] },
  { id: 'kern-1', title: 'Kern Rookie', desc: 'Finish a kerning game', progress: (s) => [count(s, 'kern-game'), 1] },
  { id: 'kern-90', title: 'Keen Eye', desc: 'Score 90+ on a kerning word', progress: (s) => [Math.min(90, best(s, 'kern')), 90] },
  { id: 'kern-97', title: 'Optical Genius', desc: 'Score 97+ on a kerning word', progress: (s) => [Math.min(97, best(s, 'kern')), 97] },
  { id: 'swipe-50', title: 'Swipe Right', desc: 'Rate 50 pairs in Type Match', progress: (s) => [count(s, 'swipe'), 50] },
  { id: 'liked-10', title: 'Curator', desc: 'Like 10 pairs', progress: (s) => [count(s, 'like'), 10] },
  { id: 'share', title: 'Show-off', desc: 'Share a pairing link', progress: (s) => [count(s, 'share'), 1] },
  { id: 'css', title: 'Ship It', desc: 'Copy the CSS for a pair', progress: (s) => [count(s, 'css'), 1] },
  { id: 'upload', title: 'Bring Your Own', desc: 'Upload your own font', progress: (s) => [count(s, 'upload'), 1] },
  { id: 'dark', title: 'Night Owl', desc: 'Switch to dark mode', progress: (s) => [count(s, 'dark'), 1] },
];

const isDone = (s, a) => {
  const [cur, goal] = a.progress(s);
  return cur >= goal;
};

const emit = () => listeners.forEach((l) => l());

/**
 * Record something the user did.
 *
 *   track('generate', { fonts: [a, b], mood })
 *   track('kern', { score })            — keeps the best score
 *   track('feature', { tag })           — distinct features toggled
 */
export function track(event, payload = {}) {
  const next = {
    counts: { ...state.counts, [event]: count(state, event) + 1 },
    sets: { ...state.sets },
    best: { ...state.best },
    unlocked: { ...state.unlocked },
  };

  const addTo = (key, values) => {
    const set = new Set(next.sets[key] ?? []);
    for (const v of values) if (v !== undefined && v !== null) set.add(v);
    next.sets[key] = [...set];
  };

  if (payload.fonts) addTo('fonts', payload.fonts);
  if (payload.mood) addTo('moods', [payload.mood]);
  if (event === 'feature') addTo('features', [payload.tag]);
  if (event === 'layout') addTo('layouts', [payload.id]);
  if (event === 'effect') addTo('effects', [payload.id]);
  if (typeof payload.score === 'number') next.best[event] = Math.max(best(next, event), payload.score);

  const fresh = ACHIEVEMENTS.filter((a) => !next.unlocked[a.id] && isDone(next, a));
  for (const a of fresh) next.unlocked[a.id] = Date.now();

  state = next;
  save();
  emit();
  fresh.forEach((a) => unlockListeners.forEach((l) => l(a)));
}

/** Called with each achievement the moment it unlocks. */
export function onUnlock(listener) {
  unlockListeners.add(listener);
  return () => unlockListeners.delete(listener);
}

export function resetAchievements() {
  state = { counts: {}, sets: {}, best: {}, unlocked: {} };
  save();
  emit();
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => state;

/** Live achievements state for React: { counts, sets, best, unlocked }. */
export const useAchievements = () => useSyncExternalStore(subscribe, getSnapshot);
