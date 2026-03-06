import { Database, Search, Zap, BarChart3, Eye, Monitor, BrainCircuit, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Architecture = () => {
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const stagger = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    const pipelineSteps = [
        { icon: Monitor, label: 'User Input', desc: 'React Frontend', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
        { icon: Search, label: 'Fetch', desc: 'Parallel Search', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        { icon: BarChart3, label: 'Score', desc: 'Geo-Scoring', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
        { icon: Zap, label: 'Filter', desc: 'SpaCy NER', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
        { icon: BrainCircuit, label: 'Summarize', desc: 'Groq LLM', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        { icon: Database, label: 'Cache', desc: 'Upstash Redis', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    ];

    const nuances = [
        {
            icon: Search, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)',
            title: 'Dual-Source Parallel Search',
            text: 'Wikipedia covers global cities but misses remote villages. We query both Wikipedia and the OneFiveNine village database simultaneously using ThreadPoolExecutor. Latency equals the slowest source, not the sum of both.'
        },
        {
            icon: BarChart3, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)',
            title: 'Geographic Scoring Algorithm',
            text: 'Wikipedia search often returns non-geographic results for location names (e.g., a deity instead of a town). Our custom scoring algorithm awards +50 for "town" or "city" descriptors and penalizes -30 for "constituency" or similar. Without this, small-town lookups would return completely irrelevant articles.'
        },
        {
            icon: Zap, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)',
            title: 'SpaCy NLP Pre-Filtering',
            text: 'Instead of sending entire Wikipedia articles to the LLM, we use SpaCy\'s NER model to extract only sentences with geo-cultural entities (GPE, LOC, FAC). This slashes the payload by over 80%, keeping inference fast and costs at zero.'
        },
        {
            icon: BrainCircuit, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)',
            title: 'LLM Summarization',
            text: 'The filtered, entity-dense sentences are handed to Groq\'s Llama 3.3 70B for structured summarization. A carefully crafted prompt forces the model to output exactly 6-7 insight categories. For villages with limited data, a specialized low-temperature prompt prevents hallucination entirely.'
        },
        {
            icon: Database, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)',
            title: 'Upstash Redis Caching',
            text: 'Before any pipeline runs, the backend checks an Upstash Redis cache via REST API. Repeat searches return in ~50ms instead of 3-5 seconds. The 12-hour TTL keeps data fresh while transforming a heavy AI workload into a lightning-fast static query.'
        },
        {
            icon: Eye, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)',
            title: 'Animated Glassmorphic Feedback',
            text: 'During the 3-5 second pipeline run, a dynamic pill badge cycles through status updates ("Locating destination...", "Analyzing data..."). Paired with Framer Motion transitions, the perceived wait time feels significantly shorter.'
        },
    ];

    return (
        <div className="fade-in" style={{
            maxWidth: '1200px',
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
                    A deep dive into the engineering that powers GCIES. Follow the data from your keyboard to a structured, cached response.
                </p>
            </div>

            {/* Pipeline Diagram */}
            <motion.div
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="glass-panel"
                style={{ padding: '2.5rem 2rem', position: 'relative', overflow: 'hidden' }}
            >
                {/* Background Orbs */}
                <div style={{ position: 'absolute', top: '-60px', left: '-60px', background: 'rgba(59, 130, 246, 0.15)', width: '180px', height: '180px', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }} />
                <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', background: 'rgba(236, 72, 153, 0.12)', width: '180px', height: '180px', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }} />

                <h2 className="gradient-text" style={{ fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem', position: 'relative', zIndex: 1 }}>
                    Data Pipeline
                </h2>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '0.95rem', position: 'relative', zIndex: 1 }}>
                    Each request flows through 6 stages before reaching the user
                </p>

                {/* Pipeline Flow */}
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="pipeline-flow"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        position: 'relative',
                        zIndex: 1
                    }}
                >
                    {pipelineSteps.map((step, i) => (
                        <motion.div key={i} variants={fadeIn} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="pipeline-node" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.6rem',
                                padding: '1.25rem 1.5rem',
                                background: 'rgba(255, 255, 255, 0.6)',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '16px',
                                border: `1.5px solid ${step.bg}`,
                                boxShadow: `0 4px 20px ${step.bg}`,
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                cursor: 'default',
                                minWidth: '110px',
                                textAlign: 'center'
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-6px) scale(1.05)';
                                    e.currentTarget.style.boxShadow = `0 8px 30px ${step.bg.replace('0.1', '0.3')}`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                    e.currentTarget.style.boxShadow = `0 4px 20px ${step.bg}`;
                                }}
                            >
                                <div style={{ background: step.bg, padding: '0.6rem', borderRadius: '12px' }}>
                                    <step.icon size={22} color={step.color} />
                                </div>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>{step.label}</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{step.desc}</span>
                            </div>

                            {/* Arrow connector */}
                            {i < pipelineSteps.length - 1 && (
                                <div className="pipeline-arrow" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
                                    <ArrowRight size={20} />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </motion.div>

                {/* Animated flow line under the pipeline */}
                <div style={{ position: 'relative', zIndex: 1, marginTop: '1.5rem' }}>
                    <svg width="100%" height="6" style={{ display: 'block' }}>
                        <defs>
                            <linearGradient id="pipelineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.6" />
                            </linearGradient>
                        </defs>
                        <rect x="0" y="1" width="100%" height="4" rx="2" fill="rgba(0,0,0,0.04)" />
                        <rect className="animate-pipeline-flow" x="0" y="1" width="20%" height="4" rx="2" fill="url(#pipelineGrad)" />
                    </svg>
                </div>
            </motion.div>

            {/* Nuances Section */}
            <div>
                <h2 className="gradient-text" style={{ fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>
                    Implementation Nuances
                </h2>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.95rem' }}>
                    The engineering decisions that make GCIES fast, accurate, and free
                </p>

                <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}
                >
                    {nuances.map((item, i) => (
                        <motion.div
                            key={i}
                            variants={fadeIn}
                            className="glass-panel"
                            style={{
                                padding: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                transition: 'transform 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ background: item.bg, padding: '0.75rem', borderRadius: '14px', width: 'fit-content' }}>
                                <item.icon size={24} color={item.color} />
                            </div>
                            <h3 className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 600, borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.8rem' }}>
                                {item.title}
                            </h3>
                            <p style={{ color: 'var(--text-dark)', lineHeight: 1.6, fontSize: '1rem' }}>
                                {item.text}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>


        </div>
    );
};

export default Architecture;
