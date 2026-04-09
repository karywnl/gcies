import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import SearchDashboard from '../components/SearchDashboard';
import SearchResults from '../components/SearchResults';
import ResultsDashboard from '../components/ResultsDashboard';
import ProgressiveLoader from '../components/ProgressiveLoader';
import { saveSearchToHistory } from '../components/SearchDashboard';

const Home = ({ initialQuery = null }) => {
    const [data, setData]                       = useState(null);
    const [loading, setLoading]                 = useState(false);
    const [error, setError]                     = useState(null);
    const [showSearch, setShowSearch]           = useState(!!initialQuery);
    const [candidates, setCandidates]           = useState(null);   // null | []
    const [candidatesLoading, setCandidatesLoading] = useState(false);
    const [pendingQuery, setPendingQuery]       = useState('');

    const location   = useLocation();
    const resultsRef = useRef(null);
    const eventSourceRef = useRef(null);

    // Reset to hero when navigating home
    useEffect(() => {
        if (location.pathname === '/') {
            setShowSearch(false);
            setData(null);
            setError(null);
            setCandidates(null);
            setCandidatesLoading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [location.key]);

    // Scroll to results when data first arrives
    useEffect(() => {
        if (data && resultsRef.current) {
            setTimeout(() => {
                const el = resultsRef.current;
                const top = el.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top, behavior: 'smooth' });
            }, 100);
        }
    }, [data]);

    // Auto-search from LocationPage (direct link)
    useEffect(() => {
        if (initialQuery) {
            handleSearch({ title: initialQuery, source: 'wikipedia', path: null });
        }
    }, []);

    /* ── Step 1: user submits a text query → fetch candidates ── */
    const handleQuery = async (queryText) => {
        if (!queryText.trim()) return;

        // Close any running stream
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setPendingQuery(queryText.trim());
        setShowSearch(true);
        setData(null);
        setError(null);
        setCandidates(null);
        setCandidatesLoading(true);

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(queryText.trim())}&source=all`);
            const results = await res.json();
            setCandidates(Array.isArray(results) ? results : []);
        } catch (e) {
            console.error('Search failed:', e);
            setCandidates([]);
        } finally {
            setCandidatesLoading(false);
        }
    };

    /* ── Step 2: user picks a candidate (or history item) → stream ── */
    const handleSearch = (searchObj) => {
        const query = searchObj.title;
        if (!query || !query.trim()) return;

        // Close any running stream
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        // Save to history
        saveSearchToHistory(searchObj);

        setCandidates(null);
        setCandidatesLoading(false);
        setShowSearch(true);
        setLoading(true);
        setError(null);
        setData(null);

        let url = `/api/stream?location_name=${encodeURIComponent(query)}`;
        if (searchObj.source && searchObj.source !== 'wikipedia')
            url += `&source=${encodeURIComponent(searchObj.source)}`;
        if (searchObj.path)
            url += `&path=${encodeURIComponent(searchObj.path)}`;
        // If the title came from disambiguation, pin it so the backend skips re-resolution
        if (searchObj.source === 'wikipedia' && searchObj.exactTitle)
            url += `&exact_title=${encodeURIComponent(searchObj.exactTitle)}`;

        const es = new EventSource(url);
        eventSourceRef.current = es;

        let insights = {};

        es.onmessage = (e) => {
            const raw = e.data;

            if (raw === '[DONE]') {
                es.close();
                eventSourceRef.current = null;
                setLoading(false);
                return;
            }

            try {
                const event = JSON.parse(raw);

                if (event.type === 'meta') {
                    setData({
                        location_name: event.location_name,
                        image_url:     event.image_url,
                        image_urls:    event.image_urls || [],
                        source:        event.source,
                        source_url:    event.source_url || '',
                        quick_facts:   event.quick_facts || {},
                        insights:      {},
                    });
                    setLoading(false);
                    window.history.replaceState(
                        null, '',
                        `/location/${encodeURIComponent(event.location_name.toLowerCase())}`
                    );

                } else if (event.type === 'insight') {
                    insights = { ...insights, [event.key]: event.value };
                    setData(prev =>
                        prev ? { ...prev, insights: { ...prev.insights, [event.key]: event.value } } : null
                    );

                } else if (event.type === 'error') {
                    es.close();
                    eventSourceRef.current = null;
                    setLoading(false);
                    const msg = event.message || '';
                    if (msg.toLowerCase().includes('could not identify') || msg.toLowerCase().includes('could not find')) {
                        setError(`Data is not available for "${query}". It may not have enough web presence. Please try another location.`);
                    } else {
                        setError('Failed to fetch data. Please try another location or check if the backend is running.');
                    }
                    setData(null);
                }
            } catch (e) {
                    console.warn('Failed to parse SSE event:', e, 'Raw:', raw);
                }
        };

        es.onerror = () => {
            es.close();
            eventSourceRef.current = null;
            setLoading(false);
            if (!data) {
                setError('Failed to fetch data. Please try another location or check if the backend is running.');
            }
        };
    };

    const inDisambiguation = candidatesLoading || candidates !== null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

            {/* Hero or Search bar */}
            {!showSearch && !data ? (
                <HeroSection
                    onStartExploring={() => setShowSearch(true)}
                    onSurpriseMe={(place) => handleSearch({ title: place, source: 'wikipedia', path: null })}
                />
            ) : (
                <SearchDashboard
                    onQuery={handleQuery}
                    onSearch={handleSearch}
                    loading={loading || candidatesLoading}
                />
            )}

            {/* Disambiguation results */}
            {inDisambiguation && (
                <SearchResults
                    candidates={candidates ?? []}
                    query={pendingQuery}
                    onSelect={handleSearch}
                    onBack={() => { setCandidates(null); setCandidatesLoading(false); }}
                    loading={candidatesLoading}
                />
            )}

            {/* Stream loading indicator */}
            {loading && !inDisambiguation && <ProgressiveLoader />}

            {/* Error */}
            {error && !inDisambiguation && (
                <div
                    className="glass-panel fade-in"
                    style={{
                        padding: '1rem 2rem', color: '#ef4444',
                        marginBottom: '2rem',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        maxWidth: '800px', width: '100%', textAlign: 'center',
                    }}
                >
                    {error}
                </div>
            )}

            {/* Results */}
            {data && !inDisambiguation && (
                <div ref={resultsRef} style={{ width: '100%' }}>
                    <ResultsDashboard data={data} onSearch={handleSearch} />
                </div>
            )}
        </div>
    );
};

export default Home;
