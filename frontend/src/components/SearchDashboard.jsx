import { useState, useRef, useEffect } from 'react';
import { Search, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HISTORY_KEY = 'gcies_history';

const saveToHistory = (searchObj) => {
    try {
        const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        const entry = { title: searchObj.title, source: searchObj.source, path: searchObj.path || null, timestamp: Date.now() };
        const deduped = existing.filter(e => e.title !== searchObj.title);
        localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...deduped].slice(0, 5)));
    } catch (e) {
        console.warn('Failed to save search history:', e);
    }
};

export const saveSearchToHistory = saveToHistory;

const getHistory = () => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch (_) { return []; }
};

const SearchDashboard = ({ onQuery, onSearch, loading }) => {
    const [query, setQuery]               = useState('');
    const [history, setHistory]           = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef(null);

    const handleFocus = () => {
        const h = getHistory();
        setHistory(h);
        if (h.length > 0) setShowDropdown(true);
    };

    const handleBlur = () => {
        // small delay so click on history item fires first
        setTimeout(() => setShowDropdown(false), 150);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const q = query.trim();
        if (!q) return;
        setShowDropdown(false);
        onQuery(q);
    };

    const handleHistoryClick = (item) => {
        setQuery(item.title);
        setShowDropdown(false);
        onSearch(item);           // go directly — no disambiguation needed
    };

    // Auto-focus when the dashboard first appears
    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 120);
        return () => clearTimeout(t);
    }, []);

    const showHistory = showDropdown && history.length > 0 && query.trim().length === 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            id="search-dashboard"
            style={{
                width: '100%',
                maxWidth: '800px',
                marginTop: '12vh',
                marginBottom: '4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                background: 'transparent',
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <h2
                    className="gradient-text floating dashboard-title"
                    style={{ fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' }}
                >
                    Where Are We Headed?
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', lineHeight: 1.6 }}>
                    Search for any place on Earth. We'll handle the rest.
                </p>
            </div>

            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}
                >
                    <div style={{ position: 'relative', flex: '1', minWidth: 'min(100%, 280px)', maxWidth: '500px' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            className="glass-input"
                            placeholder="Enter a city, town, or village name..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)' }}
                        />

                        {/* History dropdown */}
                        <AnimatePresence>
                            {showHistory && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.18 }}
                                    style={{
                                        position: 'absolute',
                                        top: '100%', left: 0, right: 0,
                                        marginTop: '0.5rem',
                                        background: 'var(--dropdown-bg)',
                                        backdropFilter: 'blur(12px)',
                                        WebkitBackdropFilter: 'blur(12px)',
                                        borderRadius: '16px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                                        border: '1px solid var(--glass-border)',
                                        overflow: 'hidden',
                                        zIndex: 50,
                                        textAlign: 'left',
                                    }}
                                >
                                    <div style={{
                                        padding: '0.5rem 1rem 0.3rem',
                                        fontSize: '0.7rem',
                                        color: 'var(--text-muted)',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                    }}>
                                        Recent
                                    </div>

                                    {history.map((item, idx) => (
                                        <div
                                            key={`${item.title}-${idx}`}
                                            onMouseDown={e => e.preventDefault()}
                                            onClick={() => handleHistoryClick(item)}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                cursor: 'pointer',
                                                borderBottom: idx < history.length - 1
                                                    ? '1px solid rgba(128,128,128,0.08)' : 'none',
                                                transition: 'background 0.15s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Clock size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                                    {item.title}
                                                </span>
                                                {item.source === 'onefivenine' && (
                                                    <span style={{
                                                        fontSize: '0.7rem', padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        background: 'rgba(16,185,129,0.1)',
                                                        color: '#10b981', fontWeight: 600, width: 'fit-content',
                                                    }}>
                                                        Village DB
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
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
                            {loading ? (
                                <>
                                    <div style={{
                                        width: '16px', height: '16px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTop: '2px solid white',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite',
                                    }} />
                                    Searching…
                                </>
                            ) : (
                                <>
                                    <Search size={20} /> Explore
                                </>
                            )}
                        </span>
                    </button>
                </form>
            </div>
        </motion.div>
    );
};

export default SearchDashboard;
