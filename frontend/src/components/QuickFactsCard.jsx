import { Users, Maximize2, Flag, MapPin, Calendar } from 'lucide-react';

const formatNumber = (n) => {
    if (!n && n !== 0) return null;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toLocaleString();
};

const Fact = ({ icon: Icon, label, value, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', borderRadius: '12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
        <div style={{ background: `${color}18`, padding: '0.5rem', borderRadius: '10px', flexShrink: 0 }}>
            <Icon size={18} color={color} />
        </div>
        <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-dark)' }}>{value}</div>
        </div>
    </div>
);

const QuickFactsCard = ({ facts }) => {
    if (!facts) return null;

    const items = [];

    if (facts.population) {
        items.push({ icon: Users, label: 'Population', value: formatNumber(facts.population), color: '#3b82f6' });
    }
    if (facts.area_km2) {
        items.push({ icon: Maximize2, label: 'Area', value: `${facts.area_km2.toLocaleString()} km²`, color: '#10b981' });
    }
    if (facts.country) {
        items.push({ icon: Flag, label: 'Country', value: facts.country, color: '#f59e0b' });
    }
    if (facts.coordinates?.lat != null && facts.coordinates?.lon != null) {
        const lat = facts.coordinates.lat.toFixed(4);
        const lon = facts.coordinates.lon.toFixed(4);
        items.push({ icon: MapPin, label: 'Coordinates', value: `${lat}, ${lon}`, color: '#ec4899' });
    }
    if (facts.founded) {
        items.push({ icon: Calendar, label: 'Founded', value: facts.founded, color: '#8b5cf6' });
    }

    if (items.length === 0) return null;

    return (
        <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                Quick Facts
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {items.map((item, idx) => (
                    <Fact key={idx} {...item} />
                ))}
            </div>
        </div>
    );
};

export default QuickFactsCard;
