import { motion } from 'framer-motion';
import { ArrowDown, Shuffle } from 'lucide-react';

const RANDOM_PLACES = [
    'Machu Picchu', 'Kyoto', 'Marrakech', 'Santorini', 'Reykjavik',
    'Petra', 'Varanasi', 'Havana', 'Timbuktu', 'Kathmandu',
    'Dubrovnik', 'Zanzibar', 'Bagan', 'Lhasa', 'Fez',
    'Chefchaouen', 'Cusco', 'Tbilisi', 'Samarkand', 'Luxor',
    'Angkor Wat', 'Cappadocia', 'Delphi', 'Patagonia', 'Queenstown',
];

const HeroSection = ({ onStartExploring, onSurpriseMe }) => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
                textAlign: 'center',
                marginTop: 'clamp(3rem, 12vh, 7rem)',
                marginBottom: 'clamp(2.5rem, 8vh, 6rem)',
                width: '100%',
                maxWidth: '900px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2rem'
            }}
        >
            <motion.h1
                variants={itemVariants}
                className="gradient-text hero-headline floating"
                style={{
                    fontSize: '3.75rem',
                    fontWeight: 800,
                    marginBottom: '0',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                    textShadow: '0 10px 30px rgba(59, 130, 246, 0.15)'
                }}
            >
                Every Place Has a Story
            </motion.h1>

            <motion.p
                variants={itemVariants}
                className="hero-subheadline"
                style={{
                    fontSize: '1.2rem',
                    color: 'var(--text-muted)',
                    maxWidth: '600px',
                    margin: '0 auto',
                    lineHeight: 1.6
                }}
            >
                From forgotten villages to iconic cities, just type a name and let our AI uncover the culture, landmarks, and history that make it remarkable.
            </motion.p>

            <motion.div variants={itemVariants} className="hero-btn-row">
                <button
                    onClick={onStartExploring}
                    className="glass-btn hero-btn"
                >
                    Start Exploring <ArrowDown size={20} className="floating" style={{ animationDuration: '2s' }} />
                </button>
                <button
                    onClick={() => {
                        const place = RANDOM_PLACES[Math.floor(Math.random() * RANDOM_PLACES.length)];
                        onSurpriseMe(place);
                    }}
                    className="glass-btn hero-btn"
                >
                    <Shuffle size={20} /> Surprise Me
                </button>
            </motion.div>
        </motion.div>
    );
};

export default HeroSection;
