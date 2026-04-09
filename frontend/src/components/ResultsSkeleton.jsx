const S = ({ style }) => <div className="skeleton-box" style={style} />;

const ResultsSkeleton = () => {
    return (
        <div className="fade-in" style={{ width: '100%', maxWidth: '1200px', margin: '2rem auto 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Hero grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: '1.25rem',
                    height: 'clamp(280px, 45vw, 500px)',
                }}>
                    {/* Left: carousel placeholder */}
                    <S style={{ height: '100%', borderRadius: '20px' }} />

                    {/* Right: map + source stacked */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                        <S style={{ flex: 1, borderRadius: '20px' }} />
                        <S style={{ height: '72px', borderRadius: '16px' }} />
                    </div>
                </div>

                {/* Weather strip */}
                <S style={{ height: '72px', borderRadius: '16px' }} />

                {/* Insight cards grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
                    gap: '1.25rem',
                }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <S key={i} style={{ height: '180px', borderRadius: '20px' }} />
                    ))}
                </div>

            </div>
        </div>
    );
};

export default ResultsSkeleton;
