import { registerLoadedFont } from '../lib/fontLoader';

export let FONTS = [
    'Wanted Sans', 'Plus Jakarta Sans', 'Bowlby One', 'Urbanist', 'Wavehaus', 'Trap',
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Raleway', 'Poppins',
    'Nunito', 'Source Sans 3', 'Oswald', 'Merriweather', 'Playfair Display',
    'DM Sans', 'Outfit', 'Space Grotesk', 'Sora', 'Cabinet Grotesk',
    'Figtree', 'Fraunces', 'Libre Baskerville', 'Cormorant Garamond',
    'EB Garamond', 'Lora', 'Josefin Sans', 'Quicksand', 'Karla',
    'Work Sans', 'Rubik', 'Barlow', 'Exo 2', 'Manrope',
    'IBM Plex Sans', 'IBM Plex Serif', 'IBM Plex Mono',
    'Fira Sans', 'Noto Sans', 'PT Sans', 'PT Serif',
    'Source Code Pro', 'JetBrains Mono', 'Space Mono',
    'Bebas Neue', 'Anton', 'Passion One',
].sort((a, b) => a.localeCompare(b));

export let FONT_METADATA = [];

// Fetches the full list of 1500+ Google Fonts asynchronously
export const fetchAllFonts = async () => {
    try {
        const response = await fetch('/font-metadata.json');
        const data = await response.json();
        if (data && Array.isArray(data)) {
            FONT_METADATA = data;
            const fetchedNames = data.map(f => f.family);
            const allFonts = new Set([...FONTS, ...fetchedNames]);
            FONTS = Array.from(allFonts).sort((a, b) => a.localeCompare(b));
            return FONTS;
        }
    } catch (e) {
        console.error('Error fetching font library:', e);
    }
    return FONTS;
};

const CUSTOM_FONT_EXT = /\.(ttf|otf|woff2?|ttc)$/i;

const uniqueFamilyName = (base) => {
    let name = base;
    let n = 2;
    while (FONTS.includes(name)) {
        name = `${base} ${n}`;
        n += 1;
    }
    return name;
};

/**
 * Loads a font file the user drops or picks locally, registering it as a
 * regular selectable family — same FONTS/FONT_METADATA lists everything
 * else reads from, just never fetched from Google. Not persisted: it only
 * lives for this tab session, same as any other in-memory preview state.
 */
export const loadCustomFont = async (file) => {
    if (!CUSTOM_FONT_EXT.test(file.name)) {
        throw new Error('Use a .ttf, .otf, .woff or .woff2 file.');
    }

    const base = file.name.replace(CUSTOM_FONT_EXT, '').replace(/[_-]+/g, ' ').trim() || 'Custom Font';
    const family = uniqueFamilyName(base);

    const buffer = await file.arrayBuffer();
    const face = new FontFace(family, buffer, { weight: '1 1000' });
    await face.load();
    document.fonts.add(face);
    registerLoadedFont(family);

    FONTS = [...FONTS, family].sort((a, b) => a.localeCompare(b));
    FONT_METADATA = [...FONT_METADATA, { family, category: 'Sans Serif', weights: [400], hasItalic: false, custom: true }];

    return family;
};
