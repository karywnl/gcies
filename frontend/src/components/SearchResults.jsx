import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, ArrowLeft, Search } from 'lucide-react';

const SOURCE_CONFIG = {
    wikipedia:   { label: 'Wikipedia',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
    onefivenine: { label: 'Village DB', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
};

/* ── Skeleton card shown while fetching ── */
const SkeletonCard = ({ delay }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay }}
        style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '1.25rem 1.5rem',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
        }}
    >
        <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'var(--glass-border)',
            animation: 'pulse 1.5s ease-in-out infinite',
            flexShrink: 0,
        }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ height: 15, width: '55%', borderRadius: 8, background: 'var(--glass-border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 12, width: '35%', borderRadius: 8, background: 'var(--glass-border)', animation: 'pulse 1.5s ease-in-out infinite 0.25s' }} />
        </div>
    </motion.div>
);

/* ── Individual result card ── */
const ResultCard = ({ item, onSelect, index }) => {
    const [hovered, setHovered] = useState(false);
    const cfg = SOURCE_CONFIG[item.source] || SOURCE_CONFIG.wikipedia;

    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, ease: 'easeOut' }}
            onClick={() => onSelect(item.source === 'wikipedia' ? { ...item, exactTitle: item.title } : item)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1.25rem 1.5rem',
                background: hovered ? 'var(--dropdown-hover)' : 'var(--glass-bg)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${hovered ? cfg.color + '55' : 'var(--glass-border)'}`,
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hovered ? `0 8px 24px ${cfg.color}20` : 'var(--glass-shadow)',
            }}
        >
            {/* Icon circle */}
            <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: cfg.bg,
                border: `1px solid ${cfg.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'transform 0.2s',
                transform: hovered ? 'scale(1.08)' : 'scale(1)',
            }}>
                <MapPin size={18} color={cfg.color} />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontWeight: 700, fontSize: '1rem',
                    color: 'var(--text-main)', marginBottom: '0.3rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {item.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: '9999px',
                        background: cfg.bg, color: cfg.color,
                        fontWeight: 600, border: `1px solid ${cfg.color}30`,
                        flexShrink: 0,
                    }}>
                        {cfg.label}
                    </span>
                    {item.description && (
                        <span style={{
                            fontSize: '0.85rem', color: 'var(--text-muted)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {item.description}
                        </span>
                    )}
                </div>
            </div>

            {/* Arrow */}
            <ChevronRight
                size={18}
                color="var(--text-muted)"
                style={{
                    flexShrink: 0,
                    transition: 'transform 0.2s',
                    transform: hovered ? 'translateX(4px)' : 'translateX(0)',
                }}
            />
        </motion.div>
    );
};

/* ── Main SearchResults component ── */
const SearchResults = ({ candidates, query, onSelect, onBack, loading }) => {
    const [directHovered, setDirectHovered] = useState(false);
    const hasResults = !loading && candidates && candidates.length > 0;
    const noResults  = !loading && candidates && candidates.length === 0;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="search-results"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{
                    width: '100%', maxWidth: '800px',
                    display: 'flex', flexDirection: 'column', gap: '1.25rem',
                }}
            >
                {/* Header */}
                <div>
                    <button
                        onClick={onBack}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', fontSize: '0.875rem',
                            fontFamily: 'Outfit, sans-serif', fontWeight: 500,
                            padding: '0.25rem 0', marginBottom: '0.9rem',
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                        <ArrowLeft size={15} />
                        Search again
                    </button>

                    <h3 style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.3rem', lineHeight: 1.3 }}>
                        Results for{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, var(--gradient-text-start) 0%, var(--gradient-text-end) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            "{query}"
                        </span>
                    </h3>

                    {!loading && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {hasResults
                                ? `${candidates.length} place${candidates.length > 1 ? 's' : ''} found — select the right one to explore`
                                : 'No exact matches — try exploring directly below'}
                        </p>
                    )}
                    {loading && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Searching…</p>
                    )}
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {loading
                        ? [0, 1, 2].map(i => <SkeletonCard key={i} delay={i * 0.06} />)
                        : candidates.map((item, i) => (
                            <ResultCard
                                key={`${item.title}-${item.source}`}
                                item={item}
                                onSelect={onSelect}
                                index={i}
                            />
                        ))
                    }
                </div>

                {/* Explore directly */}
                {!loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: hasResults ? candidates.length * 0.07 + 0.1 : 0.1 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            flexWrap: 'wrap',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid var(--glass-border)',
                        }}
                    >
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            {noResults ? 'Try exploring directly:' : "Not what you're looking for?"}
                        </span>
                        <button
                            onClick={() => onSelect({ title: query, source: 'wikipedia', path: null })}
                            onMouseEnter={() => setDirectHovered(true)}
                            onMouseLeave={() => setDirectHovered(false)}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                background: directHovered ? 'rgba(59,130,246,0.08)' : 'transparent',
                                border: `1px solid ${directHovered ? 'var(--primary)' : 'var(--glass-border)'}`,
                                borderRadius: '9999px', padding: '0.35rem 1rem',
                                cursor: 'pointer', color: 'var(--primary)',
                                fontSize: '0.875rem', fontWeight: 600,
                                fontFamily: 'Outfit, sans-serif',
                                transition: 'all 0.2s',
                            }}
                        >
                            <Search size={13} />
                            Explore "{query}" directly
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default SearchResults;
