import { motion, AnimatePresence } from 'framer-motion';
import { SAMPLE } from '../data/content';
import { Button } from '@/components/ui/button';

const transition = { type: 'spring', stiffness: 300, damping: 30 };
const variants = {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0, transition },
    exit: { opacity: 0, scale: 0.98, y: -10, transition: { duration: 0.2 } }
};

export default function PreviewArea({
    activeTab,
    primaryFont, pControls,
    secondaryFont, sControls,
    sampleText
}) {
    const pStyle = {
        fontFamily: `'${primaryFont}', sans-serif`,
        fontSize: `${pControls.size}px`,
        fontWeight: pControls.weight,
        lineHeight: pControls.lh,
        letterSpacing: `${pControls.ls}em`
    };

    const sStyle = {
        fontFamily: `'${secondaryFont}', sans-serif`,
        fontSize: `${sControls.size}px`,
        fontWeight: sControls.weight,
        lineHeight: sControls.lh,
        letterSpacing: `${sControls.ls}em`
    };

    const text = sampleText || SAMPLE.title;

    return (
        <motion.main
            className="flex-1 h-full overflow-hidden flex flex-col p-3 px-6 pb-7 bg-background relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
        >
            <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide relative min-h-0 pt-2">
                <AnimatePresence mode="wait">
                    {activeTab === 'article' && (
                        <motion.div key="article" variants={variants} initial="initial" animate="animate" exit="exit" className="max-w-[760px] mx-auto bg-card border border-border rounded-[26px] py-14 px-10 md:px-16 shadow-sm w-full">
                            <div className="mb-8">
                                <span className="inline-block bg-primary/10 text-primary text-[12px] font-semibold tracking-wider py-1.5 px-3 rounded-full mb-6 uppercase">Featured Typography</span>
                                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground" style={pStyle}>
                                    {text}
                                </h1>
                            </div>

                            <p className="text-xl text-muted-foreground mb-8" style={sStyle}>
                                {SAMPLE.lead}
                            </p>

                            <p className="leading-7 [&:not(:first-child)]:mt-6 text-foreground" style={sStyle}>
                                {SAMPLE.body1}
                            </p>

                            <blockquote className="mt-8 mb-8 border-l-2 border-primary pl-6 italic text-muted-foreground" style={sStyle}>
                                "{SAMPLE.quote}"
                            </blockquote>

                            <h2 className="scroll-m-20 border-b border-border pb-2 text-3xl font-semibold tracking-tight mt-10 mb-6 text-foreground" style={{ ...pStyle, fontSize: pControls.size * 0.75 }}>
                                The Anatomy of Type
                            </h2>

                            <p className="leading-7 [&:not(:first-child)]:mt-6 text-foreground" style={sStyle}>
                                {SAMPLE.body2}
                            </p>

                            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4 text-foreground" style={{ ...pStyle, fontSize: pControls.size * 0.6 }}>
                                Principles of Pairing
                            </h3>

                            <ul className="my-6 ml-6 list-disc [&>li]:mt-2 text-foreground" style={sStyle}>
                                <li><strong>Contrast is key:</strong> Pair a serif with a sans-serif for distinct hierarchy.</li>
                                <li><strong>Match x-heights:</strong> Fonts with similar lowercase heights often feel harmonious.</li>
                                <li><strong>Avoid overwhelming similarity:</strong> If two fonts are too close, they clash rather than complement.</li>
                            </ul>

                            <p className="leading-7 [&:not(:first-child)]:mt-6 text-foreground" style={sStyle}>
                                {SAMPLE.body3} {SAMPLE.body4}
                            </p>
                        </motion.div>
                    )}

                    {activeTab === 'hero' && (
                        <motion.div key="hero" variants={variants} initial="initial" animate="animate" exit="exit" className="w-full max-w-[1000px] mx-auto flex flex-col items-center justify-start pb-10 px-8">

                            {/* Browser Mockup Frame */}
                            <div className="w-full bg-background border border-border rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col relative">

                                {/* Mockup Header */}
                                <div className="h-12 bg-muted/30 border-b border-border flex items-center px-4 gap-2 shrink-0">
                                    <span className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm"></span>
                                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm"></span>
                                    <span className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm"></span>
                                    <div className="mx-auto h-6 w-48 bg-background/50 rounded-md border border-border/50"></div>
                                </div>

                                {/* Mockup Content (The Mini Site) */}
                                <div className="relative w-full h-[600px] overflow-y-auto overflow-x-hidden bg-background flex flex-col scroll-smooth scrollbar-hide">
                                    <nav className="flex items-center justify-between w-full py-5 px-10 bg-background/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50 transition-colors">
                                        <span className="text-[18px] font-bold text-foreground shrink-0"><span className="font-light">Just</span><span className="font-extrabold">MyType</span></span>
                                        <div className="flex gap-8">
                                            <a href="#" className="text-[14px] text-muted-foreground hover:text-foreground transition-colors" style={{ fontFamily: sStyle.fontFamily }}>Features</a>
                                            <a href="#" className="text-[14px] text-muted-foreground hover:text-foreground transition-colors" style={{ fontFamily: sStyle.fontFamily }}>Solutions</a>
                                            <a href="#" className="text-[14px] text-muted-foreground hover:text-foreground transition-colors" style={{ fontFamily: sStyle.fontFamily }}>Pricing</a>
                                        </div>
                                        <Button variant="default" size="sm" className="rounded-lg text-[13px] px-5" style={{ fontFamily: sStyle.fontFamily }}>Sign Up</Button>
                                    </nav>

                                    <section className="shrink-0 flex flex-col items-center justify-center text-center px-10 relative w-full min-h-[520px]">
                                        <div className="absolute rounded-full blur-[100px] pointer-events-none opacity-30 animate-pulse z-0 w-[500px] h-[500px] bg-primary/20 -top-[150px] -left-[150px]"></div>
                                        <div className="absolute rounded-full blur-[100px] pointer-events-none opacity-20 animate-pulse z-0 w-[400px] h-[400px] bg-secondary/30 bottom-[-50px] -right-[100px] [animation-delay:-4s]"></div>

                                        <div className="text-[13px] font-medium py-1.5 px-4 rounded-full bg-primary/10 text-primary mb-8 border border-primary/20 relative z-10" style={{ fontFamily: sStyle.fontFamily }}>🚀 Introducing the entirely new platform</div>

                                        <h1 className="text-[clamp(40px,5vw,64px)] font-extrabold text-foreground mb-6 max-w-[800px] leading-[1.1] tracking-tight relative z-10" style={pStyle}>
                                            {text.length > 50 ? text.substring(0, 50) + '…' : text || SAMPLE.heroTitle}
                                        </h1>

                                        <p className="text-[clamp(16px,2vw,22px)] text-muted-foreground mb-12 max-w-[600px] leading-relaxed relative z-10" style={sStyle}>
                                            {SAMPLE.heroSub}
                                        </p>

                                        <div className="flex gap-4 relative z-10">
                                            <Button size="lg" className="px-8 h-12 rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all text-[15px] font-semibold" style={{ fontFamily: sStyle.fontFamily }}>Start Building Free</Button>
                                            <Button size="lg" variant="outline" className="px-8 h-12 rounded-xl hover:bg-muted/50 transition-colors text-[15px] font-semibold" style={{ fontFamily: sStyle.fontFamily }}>Book a Demo</Button>
                                        </div>

                                        {/* Scroll Indicator */}
                                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60 pointer-events-none">
                                            <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground" style={{ fontFamily: sStyle.fontFamily }}>Scroll</span>
                                            <motion.div
                                                animate={{ y: [0, 8, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                                className="w-5 h-8 border-2 border-muted-foreground rounded-full flex justify-center pt-1"
                                            >
                                                <div className="w-1 h-2 bg-muted-foreground rounded-full" />
                                            </motion.div>
                                        </div>
                                    </section>

                                    {/* Dummy Feature Section */}
                                    <section className="w-full bg-muted/10 border-t border-border/30 py-24 px-12 flex flex-col relative z-20">
                                        <div className="max-w-[700px] mx-auto text-center mb-16">
                                            <h2 className="text-[clamp(28px,4vw,36px)] font-bold text-foreground mb-4" style={pStyle}>Everything you need to scale</h2>
                                            <p className="text-lg text-muted-foreground" style={sStyle}>Powerful features built into the core, ready to help you deploy faster and measure better.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[900px] mx-auto w-full">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="bg-card border border-border/50 rounded-xl p-8 flex flex-col text-left shadow-sm">
                                                    <div className="w-10 h-10 rounded-[10px] bg-primary/10 mb-6 flex items-center justify-center">
                                                        <div className="w-4 h-4 bg-primary/80 rounded-sm"></div>
                                                    </div>
                                                    <h3 className="text-[19px] font-bold text-foreground mb-3" style={pStyle}>{SAMPLE.cardTitles[i - 1]}</h3>
                                                    <p className="text-[15px] text-muted-foreground leading-relaxed" style={sStyle}>{SAMPLE.cardBodies[i - 1]}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Dummy Footer */}
                                    <footer className="w-full bg-card border-t border-border/50 py-12 px-12 text-center text-sm text-muted-foreground shrink-0" style={sStyle}>
                                        <div className="font-bold text-foreground mb-3" style={pStyle}>JustMyType © 2026</div>
                                        Mockup built for typography preview.
                                    </footer>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {activeTab === 'cards' && (
                        <div className="w-full flex-1 flex items-center justify-center -mt-20">
                            <motion.div key="cards" variants={variants} initial="initial" animate="animate" exit="exit" className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 max-w-[840px] mx-auto w-full px-8">
                                {[1, 2, 3].map((num, i) => {
                                    const gradients = [
                                        "bg-gradient-to-br from-blue-500 to-cyan-300",
                                        "bg-gradient-to-br from-pink-400 to-orange-300",
                                        "bg-gradient-to-br from-emerald-400 to-teal-300"
                                    ];
                                    return (
                                        <motion.div
                                            key={num}
                                            className="bg-card/50 rounded-xl border border-border overflow-hidden shadow-sm flex flex-col"
                                            whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                                        >
                                            <div className={`h-[130px] w-full ${gradients[i]}`}></div>
                                            <div className="p-5 flex flex-col text-left">
                                                <div className="text-[11px] font-semibold uppercase text-primary mb-2" style={{ fontFamily: sStyle.fontFamily }}>Tip 0{num}</div>
                                                <h3 className="text-foreground mb-2.5" style={{ ...pStyle, fontSize: pControls.size * 0.6 }}>{SAMPLE.cardTitles[i]}</h3>
                                                <p className="text-muted-foreground mb-3.5 line-clamp-3" style={sStyle}>{SAMPLE.cardBodies[i]}</p>
                                                <a href="#" className="text-[13px] font-medium text-primary no-underline mt-auto" style={{ fontFamily: sStyle.fontFamily }}>Read more →</a>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </motion.div>
                        </div>
                    )}

                    {activeTab === 'specimen' && (
                        <div className="w-full h-full flex items-center justify-center px-8 overflow-y-auto overflow-x-hidden scrollbar-hide">
                            <motion.div key="specimen" variants={variants} initial="initial" animate="animate" exit="exit" className="w-full max-w-[1200px] mx-auto bg-card border border-border rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col lg:flex-row">

                                {/* Primary Font Specimen */}
                                <div className="p-6 lg:w-1/2 border-b lg:border-b-0 lg:border-r border-border bg-background relative overflow-hidden flex flex-col">
                                    <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-3">
                                        <div className="text-[14px] font-semibold text-foreground tracking-tight">{pStyle.fontFamily.replace(/['"]/g, '')}</div>
                                        <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">Primary</div>
                                    </div>

                                    <div className="flex flex-col gap-6 relative z-10 flex-1 justify-start py-2" style={pStyle}>
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Alphabet</div>
                                            <div className="text-[clamp(18px,2.5vw,28px)] break-words leading-[1.3] tracking-tight text-foreground font-medium pr-2">
                                                Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-border/30">
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Numerals</div>
                                            <div className="text-[clamp(16px,2vw,24px)] text-foreground/90 tracking-[0.1em]">
                                                0123456789
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-border/30">
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Punctuation</div>
                                            <div className="text-[clamp(14px,1.5vw,20px)] text-foreground/80 tracking-[0.1em] leading-relaxed">
                                                !@#$%^&*()_+\~|{`{}`}[];:'"/?&lt;&gt;
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Secondary Font Specimen */}
                                <div className="p-6 lg:w-1/2 bg-background relative overflow-hidden flex flex-col">
                                    <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-3">
                                        <div className="text-[14px] font-semibold text-foreground tracking-tight">{sStyle.fontFamily.replace(/['']/g, '')}</div>
                                        <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">Secondary</div>
                                    </div>

                                    <div className="flex flex-col gap-6 relative z-10 flex-1 justify-start py-2" style={sStyle}>
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Alphabet</div>
                                            <div className="text-[clamp(18px,2.5vw,28px)] break-words leading-[1.3] text-foreground font-normal pr-2">
                                                Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-border/30">
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Numerals</div>
                                            <div className="text-[clamp(16px,2vw,24px)] text-foreground/90 tracking-[0.1em]">
                                                0123456789
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-border/30">
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Punctuation</div>
                                            <div className="text-[clamp(14px,1.5vw,20px)] text-foreground/80 tracking-[0.1em] leading-relaxed">
                                                !@#$%^&*()_+\~|{`{}`}[];:'"/?&lt;&gt;
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </motion.main>
    );
}
