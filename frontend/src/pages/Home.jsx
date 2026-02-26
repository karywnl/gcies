import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import HeroSection from '../components/HeroSection';
import SearchDashboard from '../components/SearchDashboard';
import ResultsDashboard from '../components/ResultsDashboard';
import ProgressiveLoader from '../components/ProgressiveLoader';

const Home = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSearch, setShowSearch] = useState(false);
    const location = useLocation();
    const resultsRef = useRef(null);

    // Reset view when navigating to home again
    useEffect(() => {
        if (location.pathname === '/') {
            setShowSearch(false);
            setData(null);
            setError(null);
            // Optionally scroll to top when resetting
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [location.key]);

    // Scroll to results when data is populated
    useEffect(() => {
        if (data && resultsRef.current) {
            // Add a small delay to ensure rendering is complete before scrolling
            setTimeout(() => {
                const element = resultsRef.current;
                const top = element.getBoundingClientRect().top + window.scrollY - 100; // Offset for navbar
                window.scrollTo({ top, behavior: 'smooth' });
            }, 100);
        }
    }, [data]);

    const handleSearch = async (searchObj) => {
        const query = searchObj.title;
        if (!query || !query.trim()) return;
        setLoading(true);
        setError(null);
        setData(null);

        try {
            let url = `/api/summarize?location_name=${encodeURIComponent(query)}`;
            if (searchObj.source) url += `&source=${encodeURIComponent(searchObj.source)}`;
            if (searchObj.path) url += `&path=${encodeURIComponent(searchObj.path)}`;

            const response = await axios.get(url);
            setData(response.data);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError(`Data is not available for "${query}". It may not have enough presence on the web. Please try another location.`);
            } else {
                setError('Failed to fetch data. Please try another location or check if the backend is running.');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
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
