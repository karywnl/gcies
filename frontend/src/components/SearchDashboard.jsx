import { useState, useEffect, useRef } from 'react';
import { Search, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HISTORY_KEY = 'gcies_history';

const saveToHistory = (searchObj) => {
    try {
        const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        const entry = { title: searchObj.title, source: searchObj.source, path: searchObj.path || null, timestamp: Date.now() };
        const deduplicated = existing.filter(e => e.title !== searchObj.title);
        const updated = [entry, ...deduplicated].slice(0, 5);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (_) {}
};

const getHistory = () => {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch (_) {
        return [];
    }
};

const SearchDashboard = ({ onSearch, loading }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isFetching, setIsFetching] = useState(false);   // blocking spinner (no data at all)
    const [isRefreshing, setIsRefreshing] = useState(false); // subtle dot (data shown, fresher data loading)
    const [isFocused, setIsFocused] = useState(false);
    const [history, setHistory] = useState([]);

    const searchCache = useRef(new Map()); // session cache: "w:query" / "v:query" → results[]
    const isFocusedRef = useRef(false);   // ref copy so Effect 1 doesn't need isFocused as dep

    // ── Helpers ────────────────────────────────────────────────────────────────
    // Look up the cache for `q` or any shorter prefix, filter by current text.
    // Returns an array (possibly empty) or null if nothing is cached at all.
    const getCached = (q) => {
        const qL = q.toLowerCase();
        // Exact cache hit
        const w = searchCache.current.get(`w:${qL}`);
        const v = searchCache.current.get(`v:${qL}`);
        if (w !== undefined || v !== undefined) {
            return [...(w ?? []), ...(v ?? [])];
        }
        // Prefix hit — find the longest shorter prefix we have cached and filter it
        for (let len = qL.length - 1; len >= 2; len--) {
            const prefix = qL.slice(0, len);
            const pw = searchCache.current.get(`w:${prefix}`);
            const pv = searchCache.current.get(`v:${prefix}`);
            const all = [...(pw ?? []), ...(pv ?? [])];
            if (all.length > 0) {
                const filtered = all.filter(r => r.title.toLowerCase().includes(qL));
                return filtered.length > 0 ? filtered : all;
            }
        }
        return null; // nothing in cache
    };

    // ── Effect: hide on search start ───────────────────────────────────────────
    useEffect(() => {
        if (loading) {
            setShowDropdown(false);
            setIsFetching(false);
            setIsRefreshing(false);
        }
    }, [loading]);

    // ── Effect 1: INSTANT — show cache on every keystroke (no debounce) ────────
    useEffect(() => {
        if (query.trim().length > 1 && isFocusedRef.current && !loading) {
            const cached = getCached(query.trim());
            if (cached !== null) {
                setSuggestions(cached);
                setShowDropdown(true);
                setIsFetching(false); // never block when we have something
            }
        } else if (query.trim().length < 2) {
            setSuggestions([]);
        }
    }, [query]); // intentionally only query — runs on every keystroke

    // ── Effect 2: NETWORK — debounced fetch for fresh results ──────────────────
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedQuery(query), 150);
        return () => clearTimeout(handler);
    }, [query]);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        if (debouncedQuery.trim().length > 1 && isFocused && !loading) {
            const q = debouncedQuery.trim();
            const qKey = q.toLowerCase();
            const wikiKey = `w:${qKey}`;
            const villageKey = `v:${qKey}`;

            const hasCachedWiki    = searchCache.current.has(wikiKey);
            const hasCachedVillage = searchCache.current.has(villageKey);

            // Fully cached — nothing to fetch
            if (hasCachedWiki && hasCachedVillage) {
                return () => controller.abort();
            }

            setShowDropdown(true);
            const hasInstantData = getCached(q) !== null;
            if (!hasInstantData) {
                setIsFetching(true);    // no data at all → show blocking spinner
            } else {
                setIsRefreshing(true);  // data visible → show subtle dot
            }

            let wiki     = searchCache.current.get(wikiKey)    ?? null;
            let villages = searchCache.current.get(villageKey) ?? null;

            const merge = () => {
                if (!signal.aborted) setSuggestions([...(wiki ?? []), ...(villages ?? [])]);
            };

            const wikiPromise = hasCachedWiki
                ? Promise.resolve()
                : fetch(`/api/search?q=${encodeURIComponent(q)}&source=wikipedia`, { signal })
                    .then(r => r.json())
                    .then(data => {
                        wiki = data;
                        searchCache.current.set(wikiKey, data);
                        merge();
                        setIsFetching(false); // first results in — stop blocking spinner
                    });

            const villagePromise = hasCachedVillage
                ? Promise.resolve()
                : fetch(`/api/search?q=${encodeURIComponent(q)}&source=villages`, { signal })
                    .then(r => r.json())
                    .then(data => {
                        villages = data;
                        searchCache.current.set(villageKey, data);
                        merge(); // silently append
                    });

            Promise.all([wikiPromise, villagePromise])
                .catch(err => { if (err.name !== 'AbortError') console.error('Search error', err); })
                .finally(() => {
                    if (!signal.aborted) { setIsFetching(false); setIsRefreshing(false); }
                });

        } else {
            setSuggestions([]);
            setIsFetching(false);
            setIsRefreshing(false);
            if (!isFocused) setShowDropdown(false);
        }

        return () => controller.abort();
    }, [debouncedQuery]);

    // ── Event handlers ─────────────────────────────────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();
        setShowDropdown(false);
        const searchObj = { title: query, source: "wikipedia", path: null };
        saveToHistory(searchObj);
        onSearch(searchObj);
    };

    const handleSelectSuggestion = (suggestion) => {
        setQuery(suggestion.title);
        setShowDropdown(false);
        saveToHistory(suggestion);
        onSearch(suggestion);
    };

    const handleFocus = () => {
        isFocusedRef.current = true;
        setIsFocused(true);
        const h = getHistory();
        setHistory(h);
        if (suggestions.length > 0 || isFetching || h.length > 0) setShowDropdown(true);
    };

    const handleBlur = () => {
        isFocusedRef.current = false;
        setIsFocused(false);
        setShowDropdown(false);
    };

    // ── Derived display state ──────────────────────────────────────────────────
    const showHistory     = isFocused && query.trim().length < 2 && history.length > 0 && !isFetching;
    const showSuggestions = isFetching || suggestions.length > 0;
    const dropdownVisible = showDropdown && (showHistory || showSuggestions);

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
                marginTop: '12vh',
                marginBottom: '4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                background: 'transparent'
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <h2 className="gradient-text floating dashboard-title" style={{ fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.02em' }}>Where Are We Headed?</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', lineHeight: 1.6 }}>Search for any place on Earth. We'll handle the rest.</p>
            </div>

            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
                    <div style={{ position: 'relative', flex: '1', minWidth: 'min(100%, 280px)', maxWidth: '500px' }}>
                        <input
                            type="text"
                            className="glass-input"
                            placeholder="Enter a city, town, or village name..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)' }}
                        />
                        <AnimatePresence>
                            {dropdownVisible && (
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
                                        background: 'var(--dropdown-bg)',
                                        backdropFilter: 'blur(10px)',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                                        border: '1px solid var(--glass-border)',
                                        overflow: 'hidden',
                                        zIndex: 50,
                                        textAlign: 'left'
                                    }}
                                >
                                    {/* Blocking spinner — only shown when no results available yet */}
                                    {isFetching ? (
                                        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                                            <div style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.1)', borderTop: '2px solid var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                            <span>Searching...</span>
                                        </div>
                                    ) : showHistory ? (
                                        <>
                                            <div style={{ padding: '0.5rem 1rem 0.25rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                                Recent
                                            </div>
                                            {history.map((item, idx) => (
                                                <div
                                                    key={`${item.title}-${idx}`}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => handleSelectSuggestion(item)}
                                                    style={{
                                                        padding: '0.75rem 1rem',
                                                        cursor: 'pointer',
                                                        borderBottom: idx < history.length - 1 ? '1px solid rgba(128,128,128,0.08)' : 'none',
                                                        transition: 'background 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <Clock size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.title}</span>
                                                        {item.source === 'onefivenine' && (
                                                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(230, 240, 255, 0.8)', color: '#3182ce', fontWeight: 600, width: 'fit-content' }}>Village DB</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            {/* Subtle refreshing indicator — results visible, fresher data loading */}
                                            {isRefreshing && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderBottom: '1px solid rgba(128,128,128,0.06)' }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-light)', animation: 'pulse 1.2s ease-in-out infinite' }} />
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Updating…</span>
                                                </div>
                                            )}
                                            {suggestions.map((item, idx) => (
                                                <div
                                                    key={`${item.title}-${item.source}`}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => handleSelectSuggestion(item)}
                                                    style={{
                                                        padding: '1rem',
                                                        cursor: 'pointer',
                                                        borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(128,128,128,0.08)' : 'none',
                                                        transition: 'background 0.2s',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '4px'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--dropdown-hover)'}
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
                                            ))}
                                        </>
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

        </motion.div>
    );
};

export default SearchDashboard;
