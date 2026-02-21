import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Page } from '../types';
import ChantCard from '../components/ChantCard';
import { mockChants } from '../data/mockChants';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  onViewChant: (id: string) => void;
}

const HomePage = ({ onNavigate, onViewChant }: HomePageProps) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const featuredChants = mockChants.slice(0, 3);

  const stats = [
    { value: "500+", label: "Sacred Chants" },
    { value: "8", label: "Byzantine Tones" },
    { value: "12", label: "Major Feasts" },
  ];

  const features = [
    {
      icon: "📜",
      title: "Byzantine Notation",
      description: "Authentic Byzantine musical notation preserved in high-quality PDF format for chanters and students."
    },
    {
      icon: "🌍",
      title: "Phonetic Support",
      description: "Arabic chants with transliteration, making sacred music accessible to non-Arabic readers."
    },
    {
      icon: "📖",
      title: "Custom Booklets",
      description: "Create personalized chant booklets for services, combining multiple selections into one PDF."
    },
    {
      icon: "🔍",
      title: "Advanced Search",
      description: "Find chants by feast, service, tone, or part of the service with powerful filtering."
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="hero" ref={heroRef}>
        <div className="hero-background">
          <div className="hero-gradient" />
          <motion.div 
            className="hero-pattern"
            style={{ y: heroY }}
          />
        </div>
        
        <motion.div 
          className="hero-content"
          style={{ opacity: heroOpacity }}
        >
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="hero-badge-dot" />
            A Sacred Treasury of Byzantine Chant
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Psaltikon
            <motion.span 
              className="hero-title-accent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Library
            </motion.span>
          </motion.h1>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Preserving and sharing the sacred tradition of Orthodox Byzantine chant 
            for the glory of God and the edification of the faithful.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <motion.button
              className="btn btn-primary btn-lg"
              onClick={() => onNavigate('library')}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Browse Library
              <motion.span
                initial={{ x: 0 }}
                whileHover={{ x: 5 }}
              >
                →
              </motion.span>
            </motion.button>
            <motion.button
              className="btn btn-secondary btn-lg"
              onClick={() => onNavigate('about')}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Our Mission
            </motion.button>
          </motion.div>

          <motion.div
            className="hero-stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="hero-stat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 + (index * 0.1) }}
              >
                <motion.div 
                  className="hero-stat-value"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 200, 
                    delay: 1.2 + (index * 0.1) 
                  }}
                >
                  {stat.value}
                </motion.div>
                <div className="hero-stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          style={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ 
            opacity: { delay: 1.5, duration: 0.5 },
            y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
          }}
        >
          <span style={{ color: 'var(--text-muted)', fontSize: '1.5rem' }}>↓</span>
        </motion.div>
      </section>

      {/* Quote Section */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container container-narrow">
          <motion.div
            className="quote-block"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <span className="quote-icon">☦</span>
            <p className="quote-text">
              "He who sings prays twice."
            </p>
            <p className="quote-source">— St. Augustine of Hippo</p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Sacred Resources</h2>
            <p>Everything you need to participate in the liturgical life of the Orthodox Church</p>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="feature-card"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <motion.div 
                  className="feature-icon"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Chants */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Featured Chants</h2>
            <p>Popular selections from our sacred music collection</p>
          </motion.div>

          <div className="chants-grid">
            {featuredChants.map((chant, index) => (
              <ChantCard
                key={chant.id}
                chant={chant}
                onView={onViewChant}
                index={index}
              />
            ))}
          </div>

          <motion.div
            style={{ textAlign: 'center', marginTop: '3rem' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.button
              className="btn btn-primary btn-lg"
              onClick={() => onNavigate('library')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              View All Chants
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Sections Overview */}
      <section className="section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Explore Our Collections</h2>
            <p>Navigate our carefully organized treasury of sacred music</p>
          </motion.div>

          <div className="features-grid">
            <motion.div
              className="feature-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -10 }}
              onClick={() => onNavigate('phonetics')}
              style={{ cursor: 'pointer' }}
            >
              <div className="feature-icon">🔤</div>
              <h3 className="feature-title">Phonetics Section</h3>
              <p className="feature-description">
                Arabic chants with phonetic transliteration, helping non-Arabic speakers 
                participate in the rich tradition of Antiochian chant.
              </p>
              <motion.span
                className="btn btn-ghost"
                whileHover={{ x: 5 }}
                style={{ marginTop: '1rem' }}
              >
                Explore →
              </motion.span>
            </motion.div>

            <motion.div
              className="feature-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -10 }}
              onClick={() => onNavigate('compositions')}
              style={{ cursor: 'pointer' }}
            >
              <div className="feature-icon">🎼</div>
              <h3 className="feature-title">Compositions</h3>
              <p className="feature-description">
                General compositions not strictly tied to a feast, including doxologies, 
                troparia, and other liturgical pieces.
              </p>
              <motion.span
                className="btn btn-ghost"
                whileHover={{ x: 5 }}
                style={{ marginTop: '1rem' }}
              >
                Explore →
              </motion.span>
            </motion.div>

            <motion.div
              className="feature-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -10 }}
              style={{ cursor: 'pointer' }}
            >
              <div className="feature-icon">📚</div>
              <h3 className="feature-title">Custom Booklets</h3>
              <p className="feature-description">
                Create personalized service booklets by selecting chants and generating 
                a combined PDF. Perfect for choir directors.
              </p>
              <motion.span
                className="btn btn-ghost"
                style={{ marginTop: '1rem' }}
              >
                Coming Soon
                <span className="coming-soon-badge" style={{ marginLeft: '0.5rem' }}>Soon</span>
              </motion.span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Byzantine Divider */}
      <div className="byzantine-divider" style={{ padding: '4rem 0' }}>
        <div className="byzantine-divider-line" />
        <motion.span 
          className="byzantine-divider-icon"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          ☦
        </motion.span>
        <div className="byzantine-divider-line" />
      </div>

      {/* Final Quote */}
      <section className="section">
        <div className="container container-narrow">
          <motion.div
            className="quote-block"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
          >
            <span className="quote-icon">☦</span>
            <p className="quote-text">
              "Sing to the Lord a new song; sing to the Lord, all the earth."
            </p>
            <p className="quote-source">— Psalm 96:1</p>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
