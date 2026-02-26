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
                    {Object.entries(insights || {}).map(([key, value], index) => (
                        <div key={index} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.3s ease' }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <h3 className="gradient-text" style={{ fontSize: '1.3rem', fontWeight: 600, borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.8rem', textTransform: 'capitalize' }}>
                                {key.replace(/_/g, ' ')}
                            </h3>
                            <p style={{ color: 'var(--text-dark)', lineHeight: 1.6, fontSize: '1.05rem' }}>
                                {value}
                            </p>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default ResultsDashboard;
