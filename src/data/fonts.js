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

// Fetches the full list of 1500+ Google Fonts asynchronously
export const fetchAllFonts = async () => {
    try {
        const response = await fetch('/all-google-fonts.json');
        const data = await response.json();
        if (data && Array.isArray(data)) {
            const allFonts = new Set([...FONTS, ...data]);
            FONTS = Array.from(allFonts).sort((a, b) => a.localeCompare(b));
            return FONTS;
        }
    } catch (e) {
        console.error('Error fetching font library:', e);
    }
    return FONTS;
};
