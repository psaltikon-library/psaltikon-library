import { useState } from 'react';
import { motion } from 'framer-motion';
import ChantCard from '../components/ChantCard';
import { compositionsChants } from '../data/mockChants';
import { Chant } from '../types';

interface CompositionsPageProps {
  onViewChant: (id: string) => void;
}

const CompositionsPage = ({ onViewChant }: CompositionsPageProps) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Divine Liturgy', 'Matins', 'Vespers'];

  const filteredCompositions = selectedCategory === 'All' 
    ? compositionsChants 
    : compositionsChants.filter((c: Chant) => c.category === selectedCategory);

  return (
    <div style={{ paddingTop: '100px' }}>
      {/* Hero Section */}
      <section style={{ 
        padding: '4rem 0',
        background: 'linear-gradient(to bottom, var(--bg-secondary), var(--bg-primary))'
      }}>
        <div className="container">
          <motion.div
            style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.span
              className="badge badge-gold"
              style={{ marginBottom: '1rem' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              🎼 Compositions
            </motion.span>
            <h1 style={{ marginBottom: '1rem' }}>General Compositions</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Organized compositions not strictly tied to a specific feast — including doxologies, 
              troparia, and other beautiful liturgical pieces for various services.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="section">
        <div className="container">
          <motion.div
            style={{ 
              display: 'flex', 
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '3rem',
              flexWrap: 'wrap'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {categories.map((category, index) => (
              <motion.button
                key={category}
                className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedCategory(category)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (index * 0.05) }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {category}
              </motion.button>
            ))}
          </motion.div>

          {/* Compositions Grid */}
          <div className="chants-grid">
            {filteredCompositions.map((composition: Chant, index: number) => (
              <ChantCard
                key={composition.id}
                chant={composition}
                onView={onViewChant}
                index={index}
              />
            ))}
          </div>

          {/* Composer Info */}
          <motion.div
            style={{ marginTop: '4rem' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>Notable Composers</h3>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}>
              {[
                { name: 'Petros Lampadarios', period: '18th Century', description: 'Master of the Great Church' },
                { name: 'Gregorios Protopsaltis', period: '19th Century', description: 'Renowned for melodic beauty' },
                { name: 'Ioannis Protopsaltis', period: '19th Century', description: 'Patriarchal Protopsaltis' }
              ].map((composer, index) => (
                <motion.div
                  key={composer.name}
                  style={{
                    padding: '1.5rem',
                    background: 'var(--bg-surface)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-light)',
                    textAlign: 'center'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                >
                  <motion.div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--burgundy), var(--gold))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                      color: 'white',
                      fontSize: '1.5rem'
                    }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    𝄞
                  </motion.div>
                  <h4 style={{ marginBottom: '0.25rem' }}>{composer.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gold-dark)', marginBottom: '0.5rem' }}>
                    {composer.period}
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {composer.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quote */}
          <motion.div
            className="quote-block"
            style={{ marginTop: '4rem' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="quote-icon">☦</span>
            <p className="quote-text">
              "Let the word of Christ dwell in you richly, teaching and admonishing one another 
              in all wisdom, singing psalms and hymns and spiritual songs, with thankfulness 
              in your hearts to God."
            </p>
            <p className="quote-source">— Colossians 3:16</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CompositionsPage;
