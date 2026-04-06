import { useState, useEffect, useCallback } from 'react';
import { Landmark, MapPin, Users, Factory, Train, BarChart3, Globe, Compass, Palmtree, BookOpen, Utensils, Music, Sparkles, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import MapCard from './MapCard';

const iconMap = {
    historical: { icon: Landmark, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    landmark:   { icon: MapPin,   color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
    culture:    { icon: Music,    color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    economic:   { icon: Factory,  color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    transport:  { icon: Train,    color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    demograph:  { icon: BarChart3,color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
    geograph:   { icon: Globe,    color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.1)' },
    location:   { icon: Compass,  color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' },
    natural:    { icon: Palmtree, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
    education:  { icon: BookOpen, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' },
    cuisine:    { icon: Utensils, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    famous:     { icon: MapPin,   color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
    local:      { icon: Users,    color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
};

const getIconForKey = (key) => {
    const lowerKey = key.toLowerCase();
    for (const [keyword, config] of Object.entries(iconMap)) {
        if (lowerKey.includes(keyword)) return config;
    }
    return { icon: Sparkles, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
};

/* ── Carousel ─────────────────────────────────────────── */
const ImageCarousel = ({ images, locationName }) => {
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);
    const count = images.length;

    const next = useCallback(() => setCurrent(i => (i + 1) % count), [count]);
    const prev = useCallback(() => setCurrent(i => (i - 1 + count) % count), [count]);

    useEffect(() => {
        if (count <= 1 || paused) return;
        const t = setInterval(next, 5000);
        return () => clearInterval(t);
    }, [count, paused, next]);

    return (
        <div
            style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', height: '100%', boxShadow: 'var(--glass-shadow)' }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* Slides */}
            {images.map((url, idx) => (
                <img
                    key={idx}
                    src={url}
                    alt={`${locationName} ${idx + 1}`}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: idx === current ? 1 : 0,
                        transition: 'opacity 0.7s ease',
                        pointerEvents: 'none',
                    }}
                />
            ))}

            {/* Gradient overlay + title + dots */}
            <div style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                padding: 'clamp(1rem, 3vw, 2rem)',
                background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 100%)',
            }}>
                <h2 style={{ color: 'white', fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)', fontWeight: 700, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                    {locationName || 'Discoveries'}
                </h2>
                {count > 1 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '0.5rem' }}>
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrent(idx)}
                                style={{
                                    width: idx === current ? '20px' : '8px',
                                    height: '8px',
                                    borderRadius: '9999px',
                                    background: idx === current ? 'white' : 'rgba(255,255,255,0.4)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    transition: 'all 0.3s ease',
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Prev / Next */}
            {count > 1 && (
                <>
                    {[{ dir: 'prev', Icon: ChevronLeft, side: { left: '10px' } }, { dir: 'next', Icon: ChevronRight, side: { right: '10px' } }].map(({ dir, Icon, side }) => (
                        <button
                            key={dir}
                            onClick={dir === 'prev' ? prev : next}
                            style={{
                                position: 'absolute', top: '50%', transform: 'translateY(-50%)', ...side,
                                background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
                                border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%',
                                width: '36px', height: '36px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'white', transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
                        >
                            <Icon size={18} />
                        </button>
                    ))}
                </>
            )}
        </div>
    );
};

/* ── Source Link Card ─────────────────────────────────── */
const SourceCard = ({ source, source_url, location_name }) => {
    const isVillageDB = source === 'onefivenine';
    const siteName = isVillageDB ? 'Village Directory' : 'Wikipedia';
    const siteColor = isVillageDB ? '#f59e0b' : '#3b82f6';
    const siteBg   = isVillageDB ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)';

    // Fallback URL construction if backend didn't send one yet
    const href = source_url || (isVillageDB
        ? 'https://www.onefivenine.com/'
        : `https://en.wikipedia.org/wiki/${encodeURIComponent((location_name || '').replace(/ /g, '_'))}`);

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-panel"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.9rem 1.1rem',
                textDecoration: 'none',
                flexShrink: 0,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                borderRadius: '16px',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--glass-shadow)'; }}
        >
            <div style={{ background: siteBg, padding: '0.55rem', borderRadius: '10px', flexShrink: 0 }}>
                <Globe size={18} color={siteColor} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Data Source
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {siteName}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                    {href.replace(/^https?:\/\//, '')}
                </div>
            </div>
            <ExternalLink size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </a>
    );
};

/* ── Main Dashboard ───────────────────────────────────── */
const ResultsDashboard = ({ data }) => {
    const { image_url, image_urls, insights, location_name, source, source_url, quick_facts } = data;

    const images = (image_urls && image_urls.length > 0) ? image_urls : (image_url ? [image_url] : []);
    const hasImages = images.length > 0;
    const hasMap = quick_facts?.coordinates?.lat != null && quick_facts?.coordinates?.lon != null;

    return (
        <div className="fade-in" style={{ width: '100%', maxWidth: '1200px', animationDelay: '0.2s', margin: '2rem auto 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* ── Hero row: Carousel (large) + Right panel (small) ── */}
                {hasImages ? (
                    <div className="hero-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr',
                        gap: '1.25rem',
                        height: 'clamp(280px, 45vw, 500px)',
                    }}>
                        {/* Left: carousel */}
                        <ImageCarousel images={images} locationName={location_name} />

                        {/* Right: map + source stacked */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', minHeight: 0 }}>
                            {hasMap && (
                                <div style={{
                                    flex: 1,
                                    minHeight: 0,
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    border: '1px solid var(--glass-border)',
                                    boxShadow: 'var(--glass-shadow)',
                                }}>
                                    <MapCard
                                        lat={quick_facts.coordinates.lat}
                                        lon={quick_facts.coordinates.lon}
                                        locationName={location_name}
                                    />
                                </div>
                            )}
                            <SourceCard source={source} source_url={source_url} location_name={location_name} />
                        </div>
                    </div>
                ) : (
                    /* No images: title + source in a simpler row */
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        {location_name && (
                            <h2 className="gradient-text" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 700 }}>
                                {location_name}
                            </h2>
                        )}
                        <SourceCard source={source} source_url={source_url} location_name={location_name} />
                    </div>
                )}

                {/* Map below hero only when there's no image (already shown in right panel otherwise) */}
                {!hasImages && hasMap && (
                    <div style={{
                        height: '280px',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        border: '1px solid var(--glass-border)',
                        boxShadow: 'var(--glass-shadow)',
                    }}>
                        <MapCard
                            lat={quick_facts.coordinates.lat}
                            lon={quick_facts.coordinates.lon}
                            locationName={location_name}
                        />
                    </div>
                )}

                {/* Warning banner for village DB */}
                {source === 'onefivenine' && (
                    <div style={{
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '1.25rem' }}>
                    {Object.entries(insights || {}).map(([key, value], index) => {
                        const { icon: IconComponent, color, bg } = getIconForKey(key);
                        return (
                            <div
                                key={index}
                                className="glass-panel"
                                style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.3s ease' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ background: bg, padding: '0.7rem', borderRadius: '12px', width: 'fit-content' }}>
                                    <IconComponent size={22} color={color} />
                                </div>
                                <h3 className="gradient-text" style={{ fontSize: '1.15rem', fontWeight: 600, borderBottom: '1px solid rgba(59,130,246,0.15)', paddingBottom: '0.75rem', textTransform: 'capitalize' }}>
                                    {key.replace(/_/g, ' ')}
                                </h3>
                                <p style={{ color: 'var(--text-dark)', lineHeight: 1.65, fontSize: '1rem' }}>
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
