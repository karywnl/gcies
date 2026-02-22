import { useState } from 'react';
import axios from 'axios';
import HeroSection from '../components/HeroSection';
import ResultsDashboard from '../components/ResultsDashboard';

const Home = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (query) => {
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        setData(null);

        try {
            const response = await axios.get(`/api/summarize?location_name=${encodeURIComponent(query)}`);
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
            <HeroSection onSearch={handleSearch} loading={loading} />

            {error && (
                <div className="glass-panel fade-in" style={{ padding: '1rem 2rem', color: '#ef4444', marginTop: '2rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    {error}
                </div>
            )}

            {data && <ResultsDashboard data={data} />}
        </div>
    );
};

export default Home;
