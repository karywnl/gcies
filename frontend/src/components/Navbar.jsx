import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Compass, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isApiLive, setIsApiLive] = useState(null); // null = checking, true = live, false = offline
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
                const response = await fetch('/api/health');
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

    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const closeMobileMenu = () => setMobileMenuOpen(false);

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
                    borderRadius: '24px', // Changed from 9999px to accommodate dropdown
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                }}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%'
                }}>
                    {/* Left: Logo */}
                    <div
                        onClick={() => { navigate('/'); closeMobileMenu(); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                    >
                        <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '12px' }}>
                            <Compass size={24} />
                        </div>
                        <span className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
                            GCIES
                        </span>
                    </div>

                    {/* Center: Navigation Links (Desktop) */}
                    <div className="desktop-nav" style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
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

                    {/* Right: API Status & Hamburger */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.4rem 0.8rem', background: 'transparent', borderRadius: '9999px', border: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                {isApiLive === null ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', animation: 'pulse 1.5s infinite' }} /> <span className="api-status-text">Checking</span>
                                    </span>
                                ) : isApiLive === true ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }} /> <span className="api-status-text">API Online</span>
                                    </span>
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }} /> <span className="api-status-text">API Offline</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Hamburger Icon (Mobile) */}
                        <div className="mobile-menu-toggle" onClick={toggleMobileMenu} style={{ cursor: 'pointer', display: 'none', color: 'var(--text-dark)' }}>
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Dropdown */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mobile-nav"
                            style={{
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                paddingTop: '1rem',
                                marginTop: '1rem',
                                borderTop: '1px solid rgba(0,0,0,0.05)'
                            }}
                        >
                            <NavLink
                                to="/"
                                className={({ isActive }) => isActive ? 'nav-link active mobile-link' : 'nav-link mobile-link'}
                                onClick={closeMobileMenu}
                            >
                                Home
                            </NavLink>
                            <NavLink
                                to="/about"
                                className={({ isActive }) => isActive ? 'nav-link active mobile-link' : 'nav-link mobile-link'}
                                onClick={closeMobileMenu}
                            >
                                About Us
                            </NavLink>
                        </motion.div>
                    )}
                </AnimatePresence>

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
          .mobile-link {
            width: 100%;
            text-align: left;
            padding: 0.5rem 1rem;
            border-radius: 8px;
          }
          .mobile-link:hover {
             background: rgba(59, 130, 246, 0.05);
          }
          .mobile-link.active::after {
              display: none;
          }
          .mobile-link.active {
              background: rgba(59, 130, 246, 0.1);
          }

          @media (max-width: 768px) {
              .desktop-nav {
                  display: none !important;
              }
              .mobile-menu-toggle {
                  display: block !important;
              }
              .api-status-text {
                  display: none;
              }
          }
          @media (min-width: 769px) {
              .mobile-nav {
                  display: none !important;
              }
              nav {
                  border-radius: 9999px !important;
              }
          }
        `}</style>
            </nav>
        </div>
    );
};

export default Navbar;
