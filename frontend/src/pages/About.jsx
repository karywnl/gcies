import { Compass, Users, Globe, Zap, Github } from 'lucide-react';
import { motion } from 'framer-motion';

const About = () => {
    const fadeInVariant = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="fade-in" style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '2rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2.5rem',
            width: '100%'
        }}>

            {/* Header Section */}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <h1 className="gradient-text floating hero-headline" style={{
                    fontSize: '3.75rem',
                    fontWeight: 800,
                    marginBottom: '1.25rem',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                    textShadow: '0 10px 30px rgba(59, 130, 246, 0.15)'
                }}>
                    Unveiling the World's Stories
                </h1>
                <p className="hero-subheadline" style={{ fontSize: '1.05rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
                    GCIES (Geo-Contextual Information Extraction & Summarization) is an intelligent tool designed to bridge the gap between curiosity and discovery. We extract the essence of any location on Earth.
                </p>
            </div>

            {/* Mission Glass Panel */}
            <motion.div
                variants={fadeInVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="glass-panel"
                style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}
            >
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', background: 'var(--primary-light)', width: '120px', height: '120px', borderRadius: '50%', filter: 'blur(50px)', opacity: 0.3 }} />
                <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', background: '#ec4899', width: '120px', height: '120px', borderRadius: '50%', filter: 'blur(50px)', opacity: 0.2 }} />

                <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Compass className="gradient-text" size={32} /> Our Mission
                </h2>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-dark)', lineHeight: 1.7 }}>
                    Our mission is to provide zero-cost, high-fidelity insights into the world's most fascinating places. By combining advanced Natural Language Processing with state-of-the-art Large Language Models, we sift through vast amounts of geographical data to bring you exactly what makes a place unique: its culture, its history, and its landmarks.
                </p>
            </motion.div>

            {/* Content Grid */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}
            >

                <motion.div variants={fadeInVariant} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '14px', width: 'fit-content' }}>
                        <Zap size={24} color="var(--primary)" />
                    </div>
                    <h3 className="gradient-text" style={{ fontSize: '1.3rem', fontWeight: 600, borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.8rem' }}>AI-Powered Speed</h3>
                    <p style={{ color: 'var(--text-dark)', lineHeight: 1.6, fontSize: '1.05rem' }}>
                        Driven by SpaCy NER and Groq's Llama 3.3 70B, our pipeline analyzes vast amounts of web data in milliseconds.
                    </p>
                </motion.div>

                <motion.div variants={fadeInVariant} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '0.75rem', borderRadius: '14px', width: 'fit-content' }}>
                        <Globe size={24} color="#ec4899" />
                    </div>
                    <h3 className="gradient-text" style={{ fontSize: '1.3rem', fontWeight: 600, borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.8rem' }}>Global Context</h3>
                    <p style={{ color: 'var(--text-dark)', lineHeight: 1.6, fontSize: '1.05rem' }}>
                        From bustling metropolises to remote hidden villages, no location is out of reach for our spatial engine.
                    </p>
                </motion.div>

                <motion.div variants={fadeInVariant} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '14px', width: 'fit-content' }}>
                        <Users size={24} color="#10b981" />
                    </div>
                    <h3 className="gradient-text" style={{ fontSize: '1.3rem', fontWeight: 600, borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.8rem' }}>Zero-Cost Access</h3>
                    <p style={{ color: 'var(--text-dark)', lineHeight: 1.6, fontSize: '1.05rem' }}>
                        Knowledge belongs to everyone. We engineered GCIES to be inherently scalable and completely free to use.
                    </p>
                </motion.div>

                <motion.a
                    href="https://github.com/karywnl/gcies"
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={fadeInVariant}
                    className="glass-panel"
                    style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', textDecoration: 'none', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(0, 0, 0, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--glass-shadow)'; }}
                >
                    <div style={{ background: 'rgba(71, 85, 105, 0.1)', padding: '0.75rem', borderRadius: '14px', width: 'fit-content' }}>
                        <Github size={24} color="#475569" />
                    </div>
                    <h3 className="gradient-text" style={{ fontSize: '1.3rem', fontWeight: 600, borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.8rem' }}>Open Source</h3>
                    <p style={{ color: 'var(--text-dark)', lineHeight: 1.6, fontSize: '1.05rem' }}>
                        GCIES is proud to be open source. Explore our codebase, contribute, or star the repository on GitHub.
                    </p>
                </motion.a>

            </motion.div>

        </div>
    );
};

export default About;
