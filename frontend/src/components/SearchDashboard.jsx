import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SearchDashboard = ({ onSearch, loading }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Hide dropdown instantly when main search starts
    useEffect(() => {
        if (loading) {
            setShowDropdown(false);
            setIsFetching(false);
        }
    }, [loading]);

    // Debounce effect
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [query]);

    // Fetch suggestions
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        if (debouncedQuery.trim().length > 1 && isFocused && !loading) {
            setIsFetching(true);
            setShowDropdown(true);
            fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, { signal })
                .then(res => res.json())
                .then(data => {
                    setSuggestions(data);
                    setIsFetching(false);
                })
                .catch(err => {
                    if (err.name === 'AbortError') {
                        console.log('Search fetch aborted for stale query');
                    } else {
                        console.error("Autocomplete Error:", err);
                        setSuggestions([]);
                        setIsFetching(false);
                        setShowDropdown(false);
                    }
                });
        } else {
            setSuggestions([]);
            setIsFetching(false);
            setShowDropdown(false);
        }

        return () => {
            controller.abort();
        };
    }, [debouncedQuery]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowDropdown(false);
        // Default to a wikipedia search structure if no dropdown item is clicked directly
        onSearch({ title: query, source: "wikipedia", path: null });
    };

    const handleSelectSuggestion = (suggestion) => {
        setQuery(suggestion.title);
        setShowDropdown(false);
        onSearch(suggestion); // Instantly search using the selected object
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
                marginTop: '15vh',
                marginBottom: '4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                background: 'transparent'
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <h2 className="gradient-text floating dashboard-title" style={{ fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' }}>Where to next?</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Type a location to see suggestions or press explore.</p>
            </div>

            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
                    <div style={{ position: 'relative', flex: '1', minWidth: 'min(100%, 280px)', maxWidth: '500px' }}>
                        <input
                            type="text"
                            className="glass-input"
                            placeholder="Sankanrankovil, Tamil Nadu"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => {
                                setIsFocused(true);
                                if (suggestions.length > 0 || isFetching) setShowDropdown(true);
                            }}
                            onBlur={() => {
                                setTimeout(() => {
                                    setIsFocused(false);
                                    setShowDropdown(false);
                                }, 250);
                            }}
                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255, 255, 255, 0.8)' }}
                        />
                        <AnimatePresence>
                            {showDropdown && (isFetching || suggestions.length > 0) && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        marginTop: '0.5rem',
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        backdropFilter: 'blur(10px)',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                        border: '1px solid rgba(255,255,255,0.5)',
                                        overflow: 'hidden',
                                        zIndex: 50,
                                        textAlign: 'left'
                                    }}
                                >
                                    {isFetching ? (
                                        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                                            <div style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.1)', borderTop: '2px solid var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                            <span>Searching...</span>
                                        </div>
                                    ) : (
                                        suggestions.map((item, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => handleSelectSuggestion(item)}
                                                style={{
                                                    padding: '1rem',
                                                    cursor: 'pointer',
                                                    borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                                                    transition: 'background 0.2s',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '4px'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.title}</span>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    {item.source === 'onefivenine' && (
                                                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(230, 240, 255, 0.8)', color: '#3182ce', fontWeight: 600 }}>Village DB</span>
                                                    )}
                                                    {item.description && (
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.description}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        type="submit"
                        className="glass-btn"
                        disabled={loading || !query.trim()}
                        style={{ opacity: (loading || !query.trim()) ? 0.7 : 1, minWidth: '140px' }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                            <Search size={20} /> Explore
                        </span>
                    </button>
                </form>
            </div>
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
