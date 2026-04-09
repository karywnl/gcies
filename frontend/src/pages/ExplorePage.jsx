import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ArrowRight, X, Loader2, MousePointer2,
    Building2, Map, Globe, Home, TreePine, Navigation,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Vite + Leaflet marker icon path
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
    iconUrl:       new URL('leaflet/dist/images/marker-icon.png',   import.meta.url).href,
    shadowUrl:     new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

// Custom pulsing pin
const pulseIcon = L.divIcon({
    className: '',
    html: `
        <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:44px;height:44px;border-radius:50%;
                background:rgba(59,130,246,0.18);animation:exploreRipple 1.8s ease-out infinite;"></div>
            <div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;
                border:3px solid white;box-shadow:0 2px 12px rgba(59,130,246,0.6);
                position:relative;z-index:1;"></div>
        </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
});

// Icon and color for each location type
const typeStyle = (type) => {
    const t = type.toLowerCase();
    if (t.includes('village') || t.includes('hamlet'))
        return { Icon: TreePine,   color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
    if (t.includes('area') || t.includes('suburb') || t.includes('city district'))
        return { Icon: Home,       color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' };
    if (t.includes('town') || t.includes('city') || t.includes('municipality'))
        return { Icon: Building2,  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
    if (t.includes('county') || t.includes('district'))
        return { Icon: Map,        color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    if (t.includes('state') || t.includes('province'))
        return { Icon: Navigation, color: '#ec4899', bg: 'rgba(236,72,153,0.1)' };
    return   { Icon: Globe,        color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' };
};

// Map click listener
const ClickHandler = ({ onMapClick, disabled }) => {
    useMapEvents({ click: (e) => { if (!disabled) onMapClick(e.latlng); } });
    return null;
};

// Single location row in the panel
const LocationRow = ({ item, index, onSelect, hierarchy }) => {
    const { Icon, color, bg } = typeStyle(item.type);
    const query = buildQuery(item, hierarchy);
    const showContext = query !== item.name;   // e.g. "Salem, Tamil Nadu" vs just "Salem"
    return (
        <motion.button
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, delay: index * 0.055, ease: 'easeOut' }}
            onClick={() => onSelect(item)}
            style={{
                width: '100%', background: 'var(--glass-bg)',
                backdropFilter: 'blur(16px)', border: '1px solid var(--glass-border)',
                borderRadius: '16px', padding: '0.85rem 1rem',
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '0.85rem',
                transition: 'box-shadow 0.18s ease',
                flexShrink: 0,
            }}
            whileHover={{ x: 5, transition: { duration: 0.15 } }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 6px 24px ${color}28`}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--glass-shadow)'}
        >
            {/* Icon badge */}
            <div style={{ background: bg, padding: '0.55rem', borderRadius: '10px', flexShrink: 0 }}>
                <Icon size={18} color={color} />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                </div>
                {showContext ? (
                    <div style={{ fontSize: '0.72rem', color: color, marginTop: '2px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.8 }}>
                        {query}
                    </div>
                ) : (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {item.type}
                    </div>
                )}
            </div>

            <ArrowRight size={15} color={color} style={{ flexShrink: 0, opacity: 0.7 }} />
        </motion.button>
    );
};

/** Build a disambiguated query from a clicked item + its parent levels.
 *  e.g. Salem (City) + Tamil Nadu (State)  →  "Salem, Tamil Nadu"
 *       Dasanaickenpati (Area) + Salem (City) + Tamil Nadu (State)  →  "Dasanaickenpati, Salem, Tamil Nadu"
 *       Tamil Nadu (State)  →  "Tamil Nadu"  (states are usually unambiguous)
 *       India (Country)     →  "India"
 */
const buildQuery = (item, hierarchy) => {
    const type    = item.type.toLowerCase();
    const idx     = hierarchy.findIndex(h => h.name === item.name && h.type === item.type);
    const parents = hierarchy.slice(idx + 1);

    const findType = (...keys) =>
        parents.find(p => keys.some(k => p.type.toLowerCase().includes(k)));

    // Countries and states are self-disambiguating
    if (type.includes('country') || type.includes('state') || type.includes('province'))
        return item.name;

    // Cities / towns: append state
    if (type.includes('city') || type.includes('town') || type.includes('municipality')) {
        const state = findType('state', 'province');
        return state ? `${item.name}, ${state.name}` : item.name;
    }

    // Districts / counties: append state
    if (type.includes('district') || type.includes('county')) {
        const state = findType('state', 'province');
        return state ? `${item.name}, ${state.name}` : item.name;
    }

    // Villages / areas / suburbs: append city then state
    const city  = findType('city', 'town', 'municipality');
    const state = findType('state', 'province');
    if (city && state) return `${item.name}, ${city.name}, ${state.name}`;
    if (city)          return `${item.name}, ${city.name}`;
    if (state)         return `${item.name}, ${state.name}`;
    return item.name;
};

// ── Main Page ───────────────────────────────────────────────
const ExplorePage = () => {
    const [pin, setPin]         = useState(null);
    const [hierarchy, setHierarchy] = useState(null);  // null=idle, []=empty, [...]
    const [loading, setLoading] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const navigate = useNavigate();

    const handleMapClick = useCallback((latlng) => {
        setPin(latlng);
        setPanelOpen(true);
        setLoading(true);
        setHierarchy(null);

        fetch(`/api/reverse?lat=${latlng.lat}&lon=${latlng.lng}`)
            .then(r => r.json())
            .then(data => {
                setHierarchy(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => {
                setHierarchy([]);
                setLoading(false);
            });
    }, []);

    const handleSelect = (item) => {
        const query = buildQuery(item, hierarchy);
        navigate(`/location/${encodeURIComponent(query.toLowerCase())}`);
    };

    const closePanel = () => {
        setPanelOpen(false);
        setTimeout(() => { setPin(null); setHierarchy(null); }, 300);
    };

    const hasResults = hierarchy && hierarchy.length > 0;
    const isEmpty    = hierarchy && hierarchy.length === 0;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', overflow: 'hidden' }}>

            {/* ── Side Panel ── */}
            <AnimatePresence>
                {panelOpen && (
                    <motion.aside
                        key="panel"
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '-100%', opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                        style={{
                            width: 'clamp(280px, 28vw, 360px)',
                            height: '100%',
                            background: 'var(--dropdown-bg)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            borderRight: '1px solid var(--glass-border)',
                            boxShadow: '4px 0 40px rgba(0,0,0,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            zIndex: 200,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Panel header */}
                        <div style={{
                            padding: '5.5rem 1.25rem 1rem',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            flexShrink: 0,
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.3rem' }}>
                                    <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.45rem', borderRadius: '10px' }}>
                                        <MapPin size={16} color="var(--primary)" />
                                    </div>
                                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                                        What's here?
                                    </h2>
                                </div>
                                {pin && (
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>
                                        {pin.lat.toFixed(4)}°N, {pin.lng.toFixed(4)}°E
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={closePanel}
                                style={{
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-muted)', padding: '0.3rem', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', transition: 'color 0.2s', flexShrink: 0,
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-main)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Sub-header label */}
                        {!loading && hasResults && (
                            <div style={{ padding: '0.75rem 1.25rem 0', flexShrink: 0 }}>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
                                    Select a level to explore:
                                </p>
                            </div>
                        )}

                        {/* Scrollable list */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '0.75rem 1.25rem 1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.6rem',
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'var(--glass-border) transparent',
                        }}>
                            {/* Loading skeletons */}
                            {loading && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                        Looking up location…
                                    </div>
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} style={{
                                            height: '64px', borderRadius: '16px',
                                            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                                            animation: 'pulse 1.5s infinite',
                                        }} />
                                    ))}
                                </>
                            )}

                            {/* Empty state */}
                            {!loading && isEmpty && (
                                <div style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    justifyContent: 'center', gap: '0.75rem', padding: '3rem 1rem',
                                    color: 'var(--text-muted)', textAlign: 'center',
                                }}>
                                    <Globe size={36} style={{ opacity: 0.28 }} />
                                    <p style={{ fontSize: '0.88rem', lineHeight: 1.55 }}>
                                        No location data found here.<br />
                                        Try clicking on land.
                                    </p>
                                </div>
                            )}

                            {/* Location hierarchy rows */}
                            {!loading && hasResults && hierarchy.map((item, i) => (
                                <LocationRow
                                    key={`${item.type}-${item.name}`}
                                    item={item}
                                    index={i}
                                    onSelect={handleSelect}
                                    hierarchy={hierarchy}
                                />
                            ))}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* ── Map ── */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <MapContainer
                    center={[20, 0]}
                    zoom={3}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ClickHandler onMapClick={handleMapClick} disabled={loading} />
                    {pin && <Marker position={[pin.lat, pin.lng]} icon={pulseIcon} />}
                </MapContainer>

                {/* "Click to discover" hint — hides after first click */}
                <AnimatePresence>
                    {!pin && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: 0.5, duration: 0.45 }}
                            style={{
                                position: 'absolute', bottom: '2.5rem', left: '50%',
                                transform: 'translateX(-50%)', zIndex: 100,
                                pointerEvents: 'none',
                                background: 'rgba(255,255,255,0.88)',
                                backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                                border: '1px solid rgba(255,255,255,0.7)', borderRadius: '9999px',
                                padding: '0.65rem 1.4rem',
                                display: 'flex', alignItems: 'center', gap: '0.55rem',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.1)', whiteSpace: 'nowrap',
                            }}
                        >
                            <MousePointer2 size={15} color="#3b82f6" />
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>
                                Click anywhere on the map to explore
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Searching spinner bottom-right of map */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'absolute', bottom: '2rem', right: '2rem', zIndex: 100,
                                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.7)', borderRadius: '9999px',
                                padding: '0.55rem 1.1rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                            }}
                        >
                            <Loader2 size={15} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>Locating…</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style>{`
                @keyframes exploreRipple {
                    0%   { transform: scale(0.6); opacity: 0.9; }
                    100% { transform: scale(2.4); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default ExplorePage;
