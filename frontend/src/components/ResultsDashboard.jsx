import { Landmark, MapPin, Users, Factory, Train, BarChart3, Globe, Compass, Palmtree, BookOpen, Utensils, Music, Sparkles } from 'lucide-react';

const iconMap = {
    historical: { icon: Landmark, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    landmark: { icon: MapPin, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
    culture: { icon: Music, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    economic: { icon: Factory, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    transport: { icon: Train, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    demograph: { icon: BarChart3, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
    geograph: { icon: Globe, color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.1)' },
    location: { icon: Compass, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' },
    natural: { icon: Palmtree, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
    education: { icon: BookOpen, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' },
    cuisine: { icon: Utensils, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    famous: { icon: MapPin, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
    local: { icon: Users, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
};

const getIconForKey = (key) => {
    const lowerKey = key.toLowerCase();
    for (const [keyword, config] of Object.entries(iconMap)) {
        if (lowerKey.includes(keyword)) return config;
    }
    return { icon: Sparkles, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
};

const ResultsDashboard = ({ data }) => {
    const { image_url, insights, location_name, source } = data;

    return (
        <div className="fade-in" style={{ width: '100%', maxWidth: '1200px', animationDelay: '0.2s', margin: '2rem auto 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Main Image Card */}
                {image_url && (
                    <div className="glass-panel no-padding" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gridColumn: '1 / -1', height: 'fit-content', maxHeight: '400px', position: 'relative', borderRadius: '24px' }}>
                        <img
                            src={image_url}
                            alt={location_name || 'Location insights'}
                            style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: 'inherit' }}
                        />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '2rem', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
                            <h2 style={{ color: 'white', fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 600, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                                {location_name || 'Discoveries'}
                            </h2>
                        </div>
                    </div>
                )}

                {/* Warning banner for village source results */}
                {source === 'onefivenine' && (
                    <div style={{
                        gridColumn: '1 / -1',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.9rem 1.25rem',
                        borderRadius: '12px',
                        background: 'rgba(234, 179, 8, 0.07)',
                        border: '1px solid rgba(234, 179, 8, 0.25)',
                        fontSize: '0.88rem',
                        lineHeight: 1.55,
                        color: 'var(--text-muted)',
                    }}>
                        <span style={{ fontSize: '1rem', marginTop: '1px' }}>⚠️</span>
                        <span>
                            <strong style={{ color: 'var(--text-main)', fontWeight: 600 }}>Third-Party Village Records</strong>
                            {' — '}Detailed public information for this village is limited. We scraped this content from the internet, hence the facts below might not be entirely accurate.
                        </span>
                    </div>
                )}

                {/* Insights Grid */}
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {Object.entries(insights || {}).map(([key, value], index) => {
                        const { icon: IconComponent, color, bg } = getIconForKey(key);
                        return (
                            <div key={index} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.3s ease' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ background: bg, padding: '0.75rem', borderRadius: '14px', width: 'fit-content' }}>
                                    <IconComponent size={24} color={color} />
                                </div>
                                <h3 className="gradient-text" style={{ fontSize: '1.3rem', fontWeight: 600, borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.8rem', textTransform: 'capitalize' }}>
                                    {key.replace(/_/g, ' ')}
                                </h3>
                                <p style={{ color: 'var(--text-dark)', lineHeight: 1.6, fontSize: '1.05rem' }}>
                                    {value}
                                </p>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

export default ResultsDashboard;
