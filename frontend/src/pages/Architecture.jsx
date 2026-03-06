import { useState, useRef, useEffect } from 'react';
import { Database, Search, Zap, BarChart3, Eye, Monitor, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

const Architecture = () => {
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const steps = [
        {
            icon: Monitor, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)',
            title: 'User Input',
            subtitle: 'React Frontend',
            text: 'The user types a location name into the React frontend. As they type, a debounced autocomplete fires real-time suggestions. Once selected, the frontend dispatches the extraction request to the FastAPI server.'
        },
        {
            icon: Search, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)',
            title: 'Dual-Source Parallel Fetch',
            subtitle: 'ThreadPoolExecutor',
            text: 'Wikipedia covers global cities but misses remote villages. The backend launches parallel requests to both Wikipedia and the OneFiveNine village database using ThreadPoolExecutor. Latency equals the slowest source, not the sum of both.'
        },
        {
            icon: BarChart3, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)',
            title: 'Geographic Scoring',
            subtitle: 'Custom Algorithm',
            text: 'Wikipedia search often returns non-geographic results (e.g., a deity instead of a town). Our scoring algorithm awards +50 for "town" or "city" descriptors and penalizes -30 for "constituency". Without this, small-town lookups return irrelevant articles.'
        },
        {
            icon: Zap, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)',
            title: 'SpaCy NER Filtering',
            subtitle: '80% Payload Reduction',
            text: 'Instead of sending entire Wikipedia articles to the LLM, SpaCy\'s NER model extracts only sentences with geo-cultural entities (GPE, LOC, FAC). This slashes the payload by over 80%, keeping inference fast and costs at zero.'
        },
        {
            icon: BrainCircuit, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)',
            title: 'LLM Summarization',
            subtitle: 'Groq Llama 3.3 70B',
            text: 'The filtered, entity-dense sentences are handed to Groq\'s Llama 3.3 70B for structured summarization. A carefully crafted prompt forces the model to output exactly 6-7 insight categories. For villages, a low-temperature prompt prevents hallucination.'
        },
        {
            icon: Database, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)',
            title: 'Redis Caching',
            subtitle: '~50ms Response Time',
            text: 'The final response is stored in Upstash Redis via REST API with a 12-hour TTL. On subsequent requests, the cached response is returned in ~50ms, completely bypassing the entire pipeline. This transforms a heavy AI workload into a lightning-fast static query.'
        },
        {
            icon: Eye, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)',
            title: 'Glassmorphic Feedback',
            subtitle: 'Perceived Performance',
            text: 'During the 3-5 second pipeline run, a dynamic pill badge cycles through status updates ("Locating destination...", "Analyzing data..."). Paired with Framer Motion transitions, the perceived wait time feels significantly shorter.'
        },
    ];

    const timelineRef = useRef(null);
    const [lineStyle, setLineStyle] = useState({ top: 0, height: 0 });

    useEffect(() => {
        const updateLine = () => {
            if (!timelineRef.current) return;
            const dots = timelineRef.current.querySelectorAll('.timeline-dot-wrapper');
            if (dots.length < 2) return;
            const containerRect = timelineRef.current.getBoundingClientRect();
            const firstDot = dots[0].getBoundingClientRect();
            const lastDot = dots[dots.length - 1].getBoundingClientRect();
            const top = firstDot.top + firstDot.height / 2 - containerRect.top;
            const bottom = lastDot.top + lastDot.height / 2 - containerRect.top;
            setLineStyle({ top, height: bottom - top });
        };
        // Run after layout settles
        const timer = setTimeout(updateLine, 100);
        window.addEventListener('resize', updateLine);
        return () => { clearTimeout(timer); window.removeEventListener('resize', updateLine); };
    }, []);

    return (
        <div className="fade-in" style={{
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '2rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '3rem',
            width: '100%'
        }}>

            {/* Hero */}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <h1 className="gradient-text floating hero-headline" style={{
                    fontSize: '3.75rem',
                    fontWeight: 800,
                    marginBottom: '1.25rem',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                    textShadow: '0 10px 30px rgba(59, 130, 246, 0.15)'
                }}>
                    Under the Hood
                </h1>
                <p className="hero-subheadline" style={{ fontSize: '1.05rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
                    Follow a request from your keyboard through every stage of the GCIES pipeline, all the way to a cached, structured response.
                </p>
            </div>

            {/* Timeline */}
            <div ref={timelineRef} className="arch-timeline" style={{ position: 'relative', padding: '2rem 0' }}>

                {/* Vertical gradient line - positioned from first to last dot */}
                <div className="timeline-line" style={{
                    position: 'absolute',
                    left: '50%',
                    top: lineStyle.top,
                    height: lineStyle.height,
                    width: '3px',
                    background: `linear-gradient(to bottom, ${steps.map((s, i) => `${s.color} ${(i / (steps.length - 1)) * 100}%`).join(', ')})`,
                    transform: 'translateX(-50%)',
                    borderRadius: '3px',
                    transition: 'top 0.3s ease, height 0.3s ease'
                }} />

                {steps.map((step, i) => {
                    const isLeft = i % 2 === 0;
                    return (
                        <div
                            key={i}
                            className="timeline-item"
                            style={{
                                display: 'flex',
                                alignItems: 'stretch',
                                marginBottom: i < steps.length - 1 ? '3rem' : 0,
                                position: 'relative',
                                flexDirection: isLeft ? 'row' : 'row-reverse'
                            }}
                        >
                            {/* Content Card */}
                            <motion.div
                                variants={fadeIn}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-80px" }}
                                className="glass-panel timeline-card"
                                style={{
                                    width: 'calc(50% - 40px)',
                                    padding: '1.75rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem',
                                    transition: 'transform 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                {/* Faded step number watermark */}
                                <span style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '12px',
                                    fontSize: '3.5rem',
                                    fontWeight: 900,
                                    lineHeight: 1,
                                    color: step.color,
                                    opacity: 0.08,
                                    pointerEvents: 'none',
                                    userSelect: 'none'
                                }}>
                                    {String(i + 1).padStart(2, '0')}
                                </span>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
                                    <div style={{ background: step.bg, padding: '0.6rem', borderRadius: '12px', flexShrink: 0 }}>
                                        <step.icon size={22} color={step.color} />
                                    </div>
                                    <div>
                                        <h3 className="gradient-text" style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.2 }}>
                                            {step.title}
                                        </h3>
                                        <span style={{ fontSize: '0.78rem', color: step.color, fontWeight: 600, letterSpacing: '0.02em' }}>
                                            {step.subtitle}
                                        </span>
                                    </div>
                                </div>
                                <p style={{ color: 'var(--text-dark)', lineHeight: 1.6, fontSize: '0.95rem', position: 'relative', zIndex: 1 }}>
                                    {step.text}
                                </p>
                            </motion.div>

                            {/* Center Dot - vertically centered to the card */}
                            <div className="timeline-dot-wrapper" style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 2
                            }}>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: step.color,
                                    boxShadow: `0 0 10px ${step.bg.replace('0.1', '0.5')}`
                                }} />
                            </div>

                            {/* Empty spacer on the other side */}
                            <div style={{ width: 'calc(50% - 40px)' }} />
                        </div>
                    );
                })}
            </div>

            {/* Responsive styles */}
            <style>{`
                @media (max-width: 768px) {
                    .arch-timeline .timeline-line {
                        left: 20px !important;
                    }
                    .arch-timeline .timeline-item {
                        flex-direction: row !important;
                        padding-left: 56px;
                    }
                    .arch-timeline .timeline-card {
                        width: 100% !important;
                    }
                    .arch-timeline .timeline-dot-wrapper {
                        left: 20px !important;
                    }
                    .arch-timeline .timeline-item > div:last-child {
                        display: none !important;
                    }
                }
            `}</style>

        </div>
    );
};

export default Architecture;
