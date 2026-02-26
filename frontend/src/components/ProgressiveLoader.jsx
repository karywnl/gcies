import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_STEPS = [
    { text: "Locating destination...", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },       // Red
    { text: "Analyzing regional data...", color: "#f97316", bg: "rgba(249, 115, 22, 0.1)" },    // Orange
    { text: "Extracting key insights...", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },    // Yellow
    { text: "Formatting results...", color: "#84cc16", bg: "rgba(132, 204, 22, 0.1)" },         // Light Green
    { text: "Almost there...", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" }                // Green
];

const ProgressiveLoader = () => {
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        // Cycle to the next message every 2.5 seconds
        const interval = setInterval(() => {
            setStepIndex((prev) => {
                if (prev === LOADING_STEPS.length - 1) return prev;
                return prev + 1;
            });
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    const currentStep = LOADING_STEPS[stepIndex];

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '2rem',
            width: '100%',
            height: '40px'
        }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={stepIndex}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.5rem 1rem',
                        background: currentStep.bg,
                        border: `1px solid ${currentStep.color}40`,
                        borderRadius: '9999px',
                        color: currentStep.color,
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        boxShadow: `0 4px 12px ${currentStep.bg}`
                    }}
                >
                    <div style={{
                        width: '12px',
                        height: '12px',
                        border: `2px solid ${currentStep.color}40`,
                        borderTop: `2px solid ${currentStep.color}`,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <span>{currentStep.text}</span>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default ProgressiveLoader;
