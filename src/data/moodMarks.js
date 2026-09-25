/**
 * Pictures for the Generate-mood picker (MagneticSelect). Only the
 * chosen chip shows its picture, so each one has to say its mood on
 * its own: a colour field and an "Aa" set in a matching style.
 *
 * Drawn here as inline SVG rather than image files, so they ship
 * inside the bundle and never flash in late. The fonts are generic
 * system stacks: an SVG loaded through <img> can't see the page's
 * webfonts.
 */
const mark = ({ bg, ink, family, weight = 700, style = 'normal', size = 40, text = 'Aa', spacing = 0 }) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88">` +
      `<rect width="88" height="88" fill="${bg}"/>` +
      `<text x="44" y="46" text-anchor="middle" dominant-baseline="middle" ` +
      `font-family="${family}" font-weight="${weight}" font-style="${style}" font-size="${size}" ` +
      `letter-spacing="${spacing}" fill="${ink}">${text}</text>` +
    `</svg>`
  )}`;

export const MOOD_MARKS = {
  // The hub of the cluster: the brand orange, a plain sans.
  any: mark({ bg: '#FF4400', ink: '#fff7f0', family: 'Helvetica, Arial, sans-serif' }),
  editorial: mark({ bg: '#f4efe6', ink: '#1b1a17', family: 'Georgia, Times New Roman, serif', weight: 400, style: 'italic', size: 44 }),
  tech: mark({ bg: '#0b0b10', ink: '#d7ff3a', family: 'Menlo, Consolas, monospace', weight: 700, size: 34 }),
  playful: mark({ bg: '#ff5fa2', ink: '#fff36b', family: 'Comic Sans MS, Chalkboard SE, cursive', weight: 700, size: 40 }),
  luxury: mark({ bg: '#1d2a3a', ink: '#e9b872', family: 'Didot, Bodoni 72, Georgia, serif', weight: 400, size: 42, spacing: 1 }),
  retro: mark({ bg: '#f2a93b', ink: '#5a2d0c', family: 'Rockwell, Courier New, serif', weight: 900, size: 40 }),
};
