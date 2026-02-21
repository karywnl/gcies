import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Compass, Activity } from 'lucide-react';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isApiLive, setIsApiLive] = useState(null); // null = checking, true = live, false = offline
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const checkApiStatus = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/health');
                if (response.ok) {
                    setIsApiLive(true);
                } else {
                    setIsApiLive(false);
                }
            } catch (error) {
                setIsApiLive(false);
            }
        };

        // Check immediately
        checkApiStatus();

        // Then poll every 30 seconds
        const interval = setInterval(checkApiStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: '1.5rem',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '0 1rem'
        }}>
            <nav
                style={{
                    width: '100%',
                    maxWidth: '800px',
                    padding: '0.75rem 1.5rem',
                    transition: 'all 0.3s ease',
                    background: scrolled ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    boxShadow: scrolled ? '0 10px 40px rgba(0, 0, 0, 0.08)' : '0 4px 30px rgba(0, 0, 0, 0.04)',
                    borderRadius: '9999px',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center'
                }}
            >
                {/* Left: Logo */}
                <div
                    onClick={() => navigate('/')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifySelf: 'start', cursor: 'pointer' }}
                >
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '12px' }}>
                        <Compass size={24} />
                    </div>
                    <span className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
                        GCIES
                    </span>
                </div>

                {/* Center: Navigation Links */}
                <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', justifySelf: 'center' }}>
                    <NavLink
                        to="/"
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        Home
                    </NavLink>
                    <NavLink
                        to="/about"
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        About Us
                    </NavLink>
                </div>

                {/* Right: API Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifySelf: 'end', padding: '0.5rem 1rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.8)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {isApiLive === null ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', animation: 'pulse 1.5s infinite' }} /> Checking
                            </span>
                        ) : isApiLive === true ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }} /> API Online
                            </span>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }} /> API Offline
                            </span>
                        )}
                    </div>
                </div>

                <style>{`
          @keyframes pulse {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
          }
          .nav-link {
            text-decoration: none;
            color: var(--text-muted);
            font-weight: 500;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            position: relative;
            padding: 0.5rem 0;
          }
          .nav-link:hover {
            color: var(--primary);
          }
          .nav-link.active {
            color: var(--primary);
            font-weight: 600;
          }
          .nav-link.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 20px;
            height: 3px;
            background: var(--primary);
            border-radius: 3px;
          }
        `}</style>
            </nav>
        </div>
    );
};

export default Navbar;
