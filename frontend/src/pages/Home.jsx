import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import SearchDashboard from '../components/SearchDashboard';
import ResultsDashboard from '../components/ResultsDashboard';
import ProgressiveLoader from '../components/ProgressiveLoader';

const Home = ({ initialQuery = null }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSearch, setShowSearch] = useState(!!initialQuery);
    const location = useLocation();
    const navigate = useNavigate();
    const resultsRef = useRef(null);
    const eventSourceRef = useRef(null);

    // Reset view when navigating to home again
    useEffect(() => {
        if (location.pathname === '/') {
            setShowSearch(false);
            setData(null);
            setError(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [location.key]);

    // Scroll to results when data first appears
    useEffect(() => {
        if (data && resultsRef.current) {
            setTimeout(() => {
                const element = resultsRef.current;
                const top = element.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top, behavior: 'smooth' });
            }, 100);
        }
    }, [data]);

    // Auto-search from initialQuery (for LocationPage)
    useEffect(() => {
        if (initialQuery) {
            handleSearch({ title: initialQuery, source: 'wikipedia', path: null });
        }
    }, []);

    const handleSearch = (searchObj) => {
        const query = searchObj.title;
        if (!query || !query.trim()) return;

        // Close any existing stream
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setLoading(true);
        setError(null);
        setData(null);

        let url = `/api/stream?location_name=${encodeURIComponent(query)}`;
        if (searchObj.source && searchObj.source !== 'wikipedia') url += `&source=${encodeURIComponent(searchObj.source)}`;
        if (searchObj.path) url += `&path=${encodeURIComponent(searchObj.path)}`;

        const es = new EventSource(url);
        eventSourceRef.current = es;

        let meta = null;
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
                    meta = event;
                    // Show the dashboard immediately with image/facts, empty insights
                    setData({
                        location_name: event.location_name,
                        image_url: event.image_url,
                        image_urls: event.image_urls || [],
                        source: event.source,
                        source_url: event.source_url || '',
                        quick_facts: event.quick_facts || {},
                        insights: {},
                    });
                    setLoading(false);
                    // Update URL to shareable form without triggering a React Router route change
                    // (navigate() would remount LocationPage → double-load; replaceState avoids that)
                    window.history.replaceState(null, '', `/location/${encodeURIComponent(event.location_name)}`);

                } else if (event.type === 'insight') {
                    insights = { ...insights, [event.key]: event.value };
                    setData(prev => prev ? { ...prev, insights: { ...prev.insights, [event.key]: event.value } } : null);

                } else if (event.type === 'error') {
                    es.close();
                    eventSourceRef.current = null;
                    setLoading(false);
                    const msg = event.message || '';
                    if (msg.toLowerCase().includes('could not identify') || msg.toLowerCase().includes('could not find')) {
                        setError(`Data is not available for "${query}". It may not have enough presence on the web. Please try another location.`);
                    } else {
                        setError('Failed to fetch data. Please try another location or check if the backend is running.');
                    }
                    setData(null);
                }
            } catch (_) {}
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {!showSearch && !data ? (
                <HeroSection onStartExploring={() => setShowSearch(true)} />
            ) : (
                <SearchDashboard onSearch={handleSearch} loading={loading} />
            )}

            {loading && <ProgressiveLoader />}

            {error && (
                <div className="glass-panel fade-in" style={{ padding: '1rem 2rem', color: '#ef4444', marginBottom: '2rem', border: '1px solid rgba(239, 68, 68, 0.3)', maxWidth: '800px', width: '100%', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            {data && (
                <div ref={resultsRef} style={{ width: '100%' }}>
                    <ResultsDashboard data={data} />
                </div>
            )}
        </div>
    );
};

export default Home;
