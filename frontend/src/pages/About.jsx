import { Compass, Users, Globe, Zap } from 'lucide-react';

const About = () => {
    return (
        <div className="fade-in" style={{
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '2rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '4rem'
        }}>

            {/* Header Section */}
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <h1 className="gradient-text floating" style={{ fontSize: '3.5rem', fontWeight: 700, marginBottom: '1rem', lineHeight: 1.2 }}>
                    Unveiling the World's Stories
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
                    GCIES (Geo-Contextual Information Extraction & Summarization) is an intelligent tool designed to bridge the gap between curiosity and discovery. We extract the essence of any location on Earth.
                </p>
            </div>

            {/* Mission Glass Panel */}
            <div className="glass-panel" style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', background: 'var(--primary-light)', width: '150px', height: '150px', borderRadius: '50%', filter: 'blur(60px)', opacity: 0.3 }} />
                <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', background: '#ec4899', width: '150px', height: '150px', borderRadius: '50%', filter: 'blur(60px)', opacity: 0.2 }} />

                <h2 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Compass className="gradient-text" /> Our Mission
                </h2>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-dark)', lineHeight: 1.8 }}>
                    Our mission is to provide zero-cost, high-fidelity insights into the world's most fascinating places. By combining advanced Natural Language Processing with state-of-the-art Large Language Models, we sift through vast amounts of geographical data to bring you exactly what makes a place unique: its culture, its history, and its landmarks.
                </p>
            </div>

            {/* Features Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>

                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '16px', width: 'fit-content' }}>
                        <Zap size={28} color="var(--primary)" />
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 600 }}>AI-Powered Speed</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Driven by SpaCy NER and Groq's Llama 3.3 70B, our pipeline analyzes vast amounts of web data in milliseconds.
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '1rem', borderRadius: '16px', width: 'fit-content' }}>
                        <Globe size={28} color="#ec4899" />
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Global Context</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        From bustling metropolises to remote hidden villages, no location is out of reach for our spatial engine.
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '16px', width: 'fit-content' }}>
                        <Users size={28} color="#10b981" />
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Zero-Cost Access</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Knowledge belongs to everyone. We engineered GCIES to be inherently scalable and completely free to use.
                    </p>
                </div>

            </div>

        </div>
    );
};

export default About;
