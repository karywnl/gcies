import { useState, useEffect } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';

const RelatedPlaces = ({ locationName, exactTitle, onSearch }) => {
    const [places, setPlaces]   = useState(null);   // null = loading, [] = none found
    const [error, setError]     = useState(false);

    useEffect(() => {
        if (!locationName) return;
        setPlaces(null);
        setError(false);

        const params = new URLSearchParams({ location_name: locationName });
        if (exactTitle) params.append('exact_title', exactTitle);

        fetch(`/api/related-places?${params}`)
            .then(r => r.json())
            .then(data => setPlaces(Array.isArray(data) ? data : []))
            .catch(() => setError(true));
    }, [locationName, exactTitle]);

    if (error || (places !== null && places.length === 0)) return null;

    return (
        <div className="fade-in" style={{ width: '100%' }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.5rem', borderRadius: '10px' }}>
                    <MapPin size={18} color="var(--primary)" />
                </div>
                <h3 className="gradient-text" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                    Related Places
                </h3>
            </div>

            {/* Horizontally scrollable row */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--glass-border) transparent',
            }}>
                {places === null
                    ? /* Loading skeletons */
                      Array.from({ length: 4 }).map((_, i) => (
                          <div
                              key={i}
                              className="compact-panel"
                              style={{
                                  minWidth: '180px',
                                  height: '130px',
                                  flexShrink: 0,
                                  animation: 'pulse 1.5s infinite',
                              }}
                          />
                      ))
                    : places.map((place, i) => (
                          <button
                              key={i}
                              onClick={() => onSearch({ title: place.title, source: 'wikipedia', path: null })}
                              className="compact-panel"
                              style={{
                                  minWidth: '180px',
                                  maxWidth: '220px',
                                  flexShrink: 0,
                                  padding: 0,
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                  display: 'flex',
                                  flexDirection: 'column',
                              }}
                              onMouseEnter={e => {
                                  e.currentTarget.style.transform = 'translateY(-4px)';
                                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(59,130,246,0.18)';
                              }}
                              onMouseLeave={e => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                              }}
                          >
                              {/* Thumbnail */}
                              {place.thumbnail ? (
                                  <div style={{ height: '90px', overflow: 'hidden', flexShrink: 0 }}>
                                      <img
                                          src={place.thumbnail}
                                          alt={place.title}
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                  </div>
                              ) : (
                                  <div style={{
                                      height: '60px',
                                      flexShrink: 0,
                                      background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                  }}>
                                      <MapPin size={24} color="var(--primary)" style={{ opacity: 0.4 }} />
                                  </div>
                              )}

                              {/* Info */}
                              <div style={{ padding: '0.75rem 0.9rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>
                                      {place.title}
                                  </div>
                                  {place.description && (
                                      <div style={{
                                          fontSize: '0.75rem',
                                          color: 'var(--text-muted)',
                                          lineHeight: 1.4,
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                      }}>
                                          {place.description}
                                      </div>
                                  )}
                                  <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      marginTop: '0.25rem',
                                      fontSize: '0.75rem',
                                      color: 'var(--primary)',
                                      fontWeight: 600,
                                  }}>
                                      Explore <ArrowRight size={11} />
                                  </div>
                              </div>
                          </button>
                      ))
                }
            </div>
        </div>
    );
};

export default RelatedPlaces;
