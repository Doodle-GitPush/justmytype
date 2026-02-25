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
            className="flex-1 h-auto lg:h-full overflow-visible lg:overflow-hidden flex flex-col p-3 px-4 lg:px-6 pb-28 lg:pb-7 bg-background relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
        >
            <div className="flex-1 flex flex-col overflow-visible lg:overflow-y-auto scrollbar-hide relative min-h-0 pt-2">
                <AnimatePresence mode="wait">
                    {activeTab === 'article' && (
                        <motion.div key="article" variants={variants} initial="initial" animate="animate" exit="exit" className="max-w-[760px] mx-auto bg-card border border-border rounded-[20px] lg:rounded-[26px] py-8 px-6 lg:py-14 lg:px-16 shadow-sm w-full">
                            <div className="mb-8">
                                <span className="inline-block bg-primary/10 text-primary text-[12px] font-semibold tracking-wider py-1.5 px-3 rounded-full mb-6 uppercase">Featured Typography</span>
                                <h1 className="scroll-m-20 text-3xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] lg:leading-tight" style={pStyle}>
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
                        <motion.div key="hero" variants={variants} initial="initial" animate="animate" exit="exit" className="w-full max-w-[1000px] mx-auto flex flex-col items-center justify-start pb-10 px-0 lg:px-8 perspective-[2000px]">

                            {/* Browser Mockup Frame */}
                            <motion.div
                                initial={{ rotateX: 20, y: 50, opacity: 0 }}
                                animate={{ rotateX: 0, y: 0, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
                                className="w-full bg-background border border-border rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1),0_20px_40px_-20px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col relative group"
                            >

                                {/* Mockup Header */}
                                <div className="h-12 bg-muted/40 border-b border-border flex items-center px-5 gap-2.5 shrink-0 backdrop-blur-md relative z-50">
                                    <span className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] shadow-sm hover:scale-110 transition-transform"></span>
                                    <span className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] shadow-sm hover:scale-110 transition-transform"></span>
                                    <span className="w-3.5 h-3.5 rounded-full bg-[#27c93f] shadow-sm hover:scale-110 transition-transform"></span>
                                    <div className="mx-auto h-7 w-64 bg-background/60 rounded-lg border border-border/40 flex items-center justify-center shadow-inner">
                                        <span className="text-[10px] text-muted-foreground/60 font-medium">justmytype.com</span>
                                    </div>
                                </div>

                                {/* Mockup Content (The Mini Site) */}
                                <div className="relative w-full h-[650px] overflow-y-auto overflow-x-hidden bg-background flex flex-col scroll-smooth scrollbar-hide">

                                    {/* Animated Grid Background */}
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
                                    <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/30 opacity-20 blur-[100px] animate-pulse pointer-events-none"></div>

                                    {/* Glass Navbar */}
                                    <nav className="flex items-center justify-between w-full py-4 px-8 md:px-12 bg-background/60 backdrop-blur-xl border-b border-border/40 sticky top-0 z-50 transition-colors">
                                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="text-[20px] font-bold text-foreground shrink-0 cursor-pointer">
                                            <span className="font-light">Design</span><span className="font-extrabold text-primary">System</span>.
                                        </motion.div>
                                        <div className="hidden md:flex gap-10">
                                            {['Product', 'Resources', 'Customers', 'Pricing'].map((item, idx) => (
                                                <motion.a
                                                    key={item} href="#" className="text-[14px] text-muted-foreground hover:text-foreground transition-colors font-medium relative group"
                                                    style={{ fontFamily: sStyle.fontFamily }}
                                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + (idx * 0.1) }}
                                                >
                                                    {item}
                                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full rounded-full"></span>
                                                </motion.a>
                                            ))}
                                        </div>
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                                            <Button variant="default" className="rounded-full text-[13px] px-6 shadow-md hover:shadow-lg transition-all" style={{ fontFamily: sStyle.fontFamily }}>Get Started</Button>
                                        </motion.div>
                                    </nav>

                                    {/* Hero Section */}
                                    <section className="shrink-0 flex flex-col items-center justify-center text-center px-6 md:px-10 relative w-full pt-28 pb-32">

                                        {/* Floating decorative elements */}
                                        <motion.div animate={{ y: [-15, 15, -15], rotate: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 left-10 lg:left-32 w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/30 backdrop-blur-3xl border border-white/10 shadow-2xl skew-x-12 hidden md:block" />
                                        <motion.div animate={{ y: [15, -15, 15], rotate: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-20 right-10 lg:right-32 w-32 h-32 rounded-full bg-gradient-to-tr from-pink-500/10 to-orange-500/20 backdrop-blur-3xl border border-white/10 shadow-2xl hidden md:block" />

                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.4 }}
                                            className="text-[12px] font-semibold tracking-wide py-1.5 px-4 rounded-full bg-muted/50 text-foreground mb-8 border border-border/50 relative z-10 backdrop-blur-md flex items-center gap-2 cursor-pointer hover:bg-muted transition-colors"
                                            style={{ fontFamily: sStyle.fontFamily }}
                                        >
                                            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                                            Announcing our new component library v2.0
                                            <span className="text-muted-foreground ml-1">→</span>
                                        </motion.div>

                                        <motion.h1
                                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
                                            className="text-[clamp(44px,6vw,72px)] font-extrabold text-foreground mb-8 max-w-[850px] leading-[1.05] tracking-tight relative z-10 [text-wrap:balance]"
                                            style={pStyle}
                                        >
                                            {text.length > 50 ? text.substring(0, 50) + '…' : text || "Crafting digital experiences with precision."}
                                        </motion.h1>

                                        <motion.p
                                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }}
                                            className="text-[clamp(17px,2vw,22px)] text-muted-foreground mb-12 max-w-[650px] leading-relaxed relative z-10"
                                            style={sStyle}
                                        >
                                            {SAMPLE.heroSub} Stop struggling with generic interfaces and start shipping pixel-perfect designs instantly.
                                        </motion.p>

                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.7 }}
                                            className="flex flex-col sm:flex-row gap-4 sm:gap-6 relative z-10"
                                        >
                                            <Button size="lg" className="px-10 h-14 rounded-full shadow-[0_8px_30px_rgba(var(--primary),0.3)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(var(--primary),0.4)] transition-all text-[16px] font-semibold" style={{ fontFamily: sStyle.fontFamily }}>Start For Free</Button>
                                            <Button size="lg" variant="secondary" className="px-10 h-14 rounded-full border border-border bg-card/50 hover:bg-card backdrop-blur-md transition-colors text-[16px] font-semibold" style={{ fontFamily: sStyle.fontFamily }}>Explore Templates</Button>
                                        </motion.div>

                                    </section>

                                    {/* Bento Grid Features Section */}
                                    <section className="w-full relative z-20 bg-muted/20 border-t border-border/50 pt-24 pb-32 px-6 sm:px-12 flex flex-col items-center">
                                        <div className="max-w-[700px] mx-auto text-center mb-16">
                                            <h2 className="text-[clamp(32px,5vw,48px)] font-bold text-foreground mb-6 tracking-tight" style={pStyle}>Built for modern teams</h2>
                                            <p className="text-[clamp(16px,2vw,18px)] text-muted-foreground leading-relaxed" style={sStyle}>Everything you need to manage your components, collaborate with your team, and ship faster than ever before.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1000px] mx-auto w-full">
                                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -50px 0px" }} transition={{ duration: 0.5 }} className="md:col-span-2 bg-card rounded-2xl border border-border p-8 flex flex-col justify-between overflow-hidden relative group hover:border-primary/30 transition-colors shadow-sm">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-20 -mt-20 transition-all group-hover:bg-primary/20"></div>
                                                <div className="relative z-10">
                                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                                                        <div className="w-5 h-5 bg-primary rounded-md shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>
                                                    </div>
                                                    <h3 className="text-[22px] font-bold text-foreground mb-3" style={pStyle}>{SAMPLE.cardTitles[0] || 'Real-time collaboration'}</h3>
                                                    <p className="text-muted-foreground text-[15px] leading-relaxed max-w-[400px]" style={sStyle}>{SAMPLE.cardBodies[0] || 'Work together with your team in real-time. Share feedback, leave comments, and make decisions faster.'}</p>
                                                </div>
                                            </motion.div>
                                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -50px 0px" }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-card rounded-2xl border border-border p-8 flex flex-col relative overflow-hidden hover:border-secondary/30 transition-colors shadow-sm">
                                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-[50px]"></div>
                                                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-6 border border-secondary/20">
                                                    <div className="w-4 h-4 border-2 border-secondary rounded-full shadow-[0_0_10px_rgba(var(--secondary),0.5)]"></div>
                                                </div>
                                                <h3 className="text-[22px] font-bold text-foreground mb-3" style={pStyle}>{SAMPLE.cardTitles[1] || 'Version history'}</h3>
                                                <p className="text-muted-foreground text-[15px] leading-relaxed" style={sStyle}>{SAMPLE.cardBodies[1] || 'Never lose your work again. Access previous versions of your designs instantly.'}</p>
                                            </motion.div>
                                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -50px 0px" }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-card rounded-2xl border border-border p-8 flex flex-col relative overflow-hidden hover:border-emerald-500/30 transition-colors shadow-sm">
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px]"></div>
                                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
                                                    <div className="w-4 h-4 bg-emerald-500 rotate-45 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                                </div>
                                                <h3 className="text-[22px] font-bold text-foreground mb-3" style={pStyle}>{SAMPLE.cardTitles[2] || 'Auto-layout'}</h3>
                                                <p className="text-muted-foreground text-[15px] leading-relaxed" style={sStyle}>{SAMPLE.cardBodies[2] || 'Designs that adapt automatically. Build interfaces that look great on any screen.'}</p>
                                            </motion.div>
                                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -50px 0px" }} transition={{ duration: 0.5, delay: 0.3 }} className="md:col-span-2 bg-card rounded-2xl border border-border p-8 flex flex-col justify-between overflow-hidden relative group hover:border-blue-500/30 transition-colors shadow-sm">
                                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-background to-transparent pointer-events-none z-10"></div>
                                                <div className="relative z-20">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                            <div className="w-6 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                                        </div>
                                                        <h3 className="text-[22px] font-bold text-foreground" style={pStyle}>Advanced Analytics</h3>
                                                    </div>
                                                    <p className="text-muted-foreground text-[15px] leading-relaxed max-w-[500px]" style={sStyle}>Gain deep insights into how your team uses the design system. Track adoption, measure efficiency, and identify areas for improvement seamlessly.</p>
                                                </div>
                                                {/* Mini graph decoration */}
                                                <div className="absolute bottom-6 right-10 flex items-end gap-2.5 opacity-30 group-hover:opacity-70 transition-opacity z-0 duration-500">
                                                    {[50, 80, 45, 110, 75, 140].map((h, i) => (
                                                        <div key={i} className="w-8 bg-blue-500/80 rounded-t-sm" style={{ height: h }}></div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </div>
                                    </section>

                                    {/* Call to Action Section */}
                                    <section className="w-full relative z-20 bg-primary/95 text-primary-foreground py-24 px-6 sm:px-12 flex flex-col items-center">
                                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
                                        <div className="absolute -top-[150px] -right-[150px] w-[400px] h-[400px] rounded-full bg-white/20 blur-[100px] pointer-events-none"></div>
                                        <div className="absolute -bottom-[150px] -left-[150px] w-[400px] h-[400px] rounded-full bg-black/20 blur-[100px] pointer-events-none"></div>

                                        <div className="max-w-[800px] mx-auto text-center relative z-10 flex flex-col items-center w-full">
                                            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[clamp(36px,5vw,56px)] font-extrabold mb-6 tracking-tight leading-[1.1]" style={pStyle}>
                                                Ready to transform your workflow?
                                            </motion.h2>
                                            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-[clamp(16px,2vw,20px)] text-primary-foreground/80 mb-10 max-w-[600px] leading-relaxed" style={sStyle}>
                                                Join thousands of designers and developers who are already building better products, faster.
                                            </motion.p>
                                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                                <button className="h-14 px-8 rounded-full bg-background text-foreground text-[16px] font-bold shadow-xl hover:scale-105 transition-transform shrink-0" style={{ fontFamily: sStyle.fontFamily }}>Start 14-day free trial</button>
                                                <button className="h-14 px-8 rounded-full bg-black/20 text-white text-[16px] font-bold border border-white/20 hover:bg-black/30 transition-colors backdrop-blur-md shrink-0" style={{ fontFamily: sStyle.fontFamily }}>Talk to Sales</button>
                                            </motion.div>
                                        </div>
                                    </section>

                                    {/* Premium Footer */}
                                    <footer className="w-full bg-card border-t border-border pt-20 pb-10 px-10 md:px-16 relative z-20 flex flex-col">
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
                                            <div className="col-span-2 flex flex-col">
                                                <span className="text-[24px] font-bold text-foreground mb-6"><span className="font-light">Design</span><span className="font-extrabold text-primary">System</span>.</span>
                                                <p className="text-muted-foreground text-[15px] leading-relaxed max-w-[300px] mb-8" style={sStyle}>
                                                    The most powerful component library and design system management platform on the web.
                                                </p>
                                                <div className="flex gap-4">
                                                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer text-muted-foreground"><span className="text-xs border border-current rounded-[3px] px-1 font-bold">in</span></div>
                                                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer text-muted-foreground"><span className="text-sm font-bold">X</span></div>
                                                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer text-muted-foreground"><span className="text-sm font-bold border-[1.5px] border-current rounded-full w-5 h-5 flex items-center justify-center">f</span></div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-4" style={{ fontFamily: sStyle.fontFamily }}>
                                                <h4 className="text-[14px] font-bold text-foreground tracking-wider uppercase mb-2">Product</h4>
                                                {['Features', 'Integrations', 'Pricing', 'Changelog', 'Docs'].map(link => (
                                                    <a key={link} href="#" className="text-[14px] text-muted-foreground hover:text-primary transition-colors">{link}</a>
                                                ))}
                                            </div>
                                            <div className="flex flex-col gap-4" style={{ fontFamily: sStyle.fontFamily }}>
                                                <h4 className="text-[14px] font-bold text-foreground tracking-wider uppercase mb-2">Company</h4>
                                                {['About Us', 'Careers', 'Blog', 'Contact', 'Partners'].map(link => (
                                                    <a key={link} href="#" className="text-[14px] text-muted-foreground hover:text-primary transition-colors">{link}</a>
                                                ))}
                                            </div>
                                            <div className="flex flex-col gap-4" style={{ fontFamily: sStyle.fontFamily }}>
                                                <h4 className="text-[14px] font-bold text-foreground tracking-wider uppercase mb-2">Legal</h4>
                                                {['Privacy Policy', 'Terms of Service', 'Cookie', 'Security'].map(link => (
                                                    <a key={link} href="#" className="text-[14px] text-muted-foreground hover:text-primary transition-colors">{link}</a>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border/50 text-muted-foreground text-[14px]" style={sStyle}>
                                            <p>© 2026 DesignSystem Inc. All rights reserved.</p>
                                            <div className="flex gap-6 mt-4 md:mt-0">
                                                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div> All systems operational</span>
                                            </div>
                                        </div>
                                    </footer>

                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                    {activeTab === 'cards' && (
                        <div className="w-full flex-1 flex items-center justify-center lg:-mt-20">
                            <motion.div key="cards" variants={variants} initial="initial" animate="animate" exit="exit" className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 max-w-[840px] mx-auto w-full px-4 lg:px-8">
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
                        <div className="w-full h-full flex lg:items-center justify-center px-0 lg:px-8 overflow-y-visible lg:overflow-y-auto overflow-x-hidden scrollbar-hide">
                            <motion.div key="specimen" variants={variants} initial="initial" animate="animate" exit="exit" className="w-full max-w-[1200px] mx-auto bg-card border lg:border-border border-transparent lg:rounded-xl shadow-none lg:shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col lg:flex-row">

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
