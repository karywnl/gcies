import { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

const SearchDashboard = ({ onSearch, loading }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            id="search-dashboard"
            style={{
                width: '100%',
                maxWidth: '800px',
                marginTop: '15vh', // Push it down somewhat mimicking a hero position
                marginBottom: '4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                background: 'transparent'
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <h2 className="gradient-text floating dashboard-title" style={{ fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' }}>Where to next?</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Enter any location to begin your journey.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    className="glass-input"
                    placeholder="Sankarankovil, Tamil Nadu"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ flex: '1', minWidth: 'min(100%, 280px)', maxWidth: '500px', background: 'rgba(255, 255, 255, 0.8)' }}
                />
                <button
                    type="submit"
                    className="glass-btn"
                    disabled={loading || !query.trim()}
                    style={{ opacity: (loading || !query.trim()) ? 0.7 : 1, minWidth: '140px' }}
                >
                    {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                            <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            Searching...
                        </span>
                    ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                            <Search size={20} /> Explore
                        </span>
                    )}
                </button>
            </form>
            <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .dashboard-title {
            font-size: 4rem;
        }
        @media (max-width: 768px) {
            #search-dashboard {
                width: 90% !important;
                margin-top: 10vh !important;
            }
            .dashboard-title {
                font-size: 2.5rem !important;
            }
        }
      `}</style>
        </motion.div>
    );
};

export default SearchDashboard;
