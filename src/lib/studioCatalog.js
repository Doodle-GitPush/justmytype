import { Sparkles, Frame, Grid3x3, MoveHorizontal, Heart } from 'lucide-react';

/**
 * Every studio and game, described once. The Studio home, the
 * launcher pill's teasers and the after-Generate suggestion all
 * read from here, so a new mode shows up everywhere by adding it
 * in one place.
 */
export const STUDIO_SECTIONS = {
  create: {
    label: 'Create',
    title: 'Make something with this pair',
    items: [
      { id: 'animate', label: 'Animate', desc: 'Twelve kinetic effects. Export MP4, GIF or a still.', teaser: 'Animate this pair', icon: Sparkles },
      { id: 'poster', label: 'Poster', desc: 'Layer, rotate, outline and blend type.', teaser: 'Make a poster', icon: Frame },
      { id: 'lab', label: 'Letter Lab', desc: 'Grids, rings, waves and masks made of letters.', teaser: 'Build a letter pattern', icon: Grid3x3 },
    ],
  },
  play: {
    label: 'Play',
    title: 'Train your type eye',
    items: [
      { id: 'kern', label: 'Kern Game', desc: 'Space a word by eye, scored against the font.', teaser: 'Test your kerning', icon: MoveHorizontal },
      { id: 'match', label: 'Type Match', desc: 'Swipe on pairings and find your taste.', teaser: 'Swipe on pairings', icon: Heart },
    ],
  },
};

export const STUDIO_ITEMS = [...STUDIO_SECTIONS.create.items, ...STUDIO_SECTIONS.play.items];
