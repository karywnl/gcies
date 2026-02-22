import { Compass, Users, Globe, Zap } from 'lucide-react';

const About = () => {
    return (
        <div className="fade-in" style={{
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '2rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2.5rem'
        }}>

            {/* Header Section */}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <h1 className="gradient-text floating" style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '0.75rem', lineHeight: 1.2 }}>
                    Unveiling the World's Stories
                </h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
                    GCIES (Geo-Contextual Information Extraction & Summarization) is an intelligent tool designed to bridge the gap between curiosity and discovery. We extract the essence of any location on Earth.
                </p>
            </div>

            {/* Mission Glass Panel */}
            <div className="glass-panel" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', background: 'var(--primary-light)', width: '120px', height: '120px', borderRadius: '50%', filter: 'blur(50px)', opacity: 0.3 }} />
                <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', background: '#ec4899', width: '120px', height: '120px', borderRadius: '50%', filter: 'blur(50px)', opacity: 0.2 }} />

                <h2 style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Compass className="gradient-text" size={24} /> Our Mission
                </h2>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-dark)', lineHeight: 1.7 }}>
                    Our mission is to provide zero-cost, high-fidelity insights into the world's most fascinating places. By combining advanced Natural Language Processing with state-of-the-art Large Language Models, we sift through vast amounts of geographical data to bring you exactly what makes a place unique: its culture, its history, and its landmarks.
                </p>
            </div>

            {/* Features Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '14px', width: 'fit-content' }}>
                        <Zap size={24} color="var(--primary)" />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>AI-Powered Speed</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                        Driven by SpaCy NER and Groq's Llama 3.3 70B, our pipeline analyzes vast amounts of web data in milliseconds.
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '0.75rem', borderRadius: '14px', width: 'fit-content' }}>
                        <Globe size={24} color="#ec4899" />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Global Context</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                        From bustling metropolises to remote hidden villages, no location is out of reach for our spatial engine.
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '14px', width: 'fit-content' }}>
                        <Users size={24} color="#10b981" />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Zero-Cost Access</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                        Knowledge belongs to everyone. We engineered GCIES to be inherently scalable and completely free to use.
                    </p>
                </div>

            </div>

        </div>
    );
};

export default About;
