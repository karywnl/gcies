import { useState } from 'react';
import { Search } from 'lucide-react';

const HeroSection = ({ onSearch, loading }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <div className="fade-in" style={{ textAlign: 'center', marginTop: '5vh', marginBottom: '3rem', width: '100%', maxWidth: '800px' }}>
            <h1 className="gradient-text floating" style={{ fontSize: '3.5rem', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Discover the World
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
                Enter a village or town name to uncover its hidden gems, rich culture, and historical landmarks instantly.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    className="glass-input"
                    placeholder="Sankarankovil"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ flex: '1', minWidth: '280px', maxWidth: '500px' }}
                />
                <button
                    type="submit"
                    className="glass-btn"
                    disabled={loading || !query.trim()}
                    style={{ opacity: (loading || !query.trim()) ? 0.7 : 1 }}
                >
                    {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            Searching...
                        </span>
                    ) : (
                        <>
                            <Search size={20} /> Explore
                        </>
                    )}
                </button>
            </form>
            <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
};

export default HeroSection;
