import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { phoneticsChants } from '../data/mockChants';
import { Chant } from '../types';

interface PhoneticsPageProps {
  onViewChant: (id: string) => void;
}

const PhoneticsPage = ({ onViewChant }: PhoneticsPageProps) => {
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [selectedChant, setSelectedChant] = useState<Chant | null>(null);

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
              className="badge badge-purple"
              style={{ marginBottom: '1rem' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              🔤 Phonetics Section
            </motion.span>
            <h1 style={{ marginBottom: '1rem' }}>Arabic Chants with Transliteration</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Access Byzantine notation for Arabic chants with phonetic transliteration, 
              helping non-Arabic speakers participate in the rich tradition of Antiochian chant.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Toggle Section */}
      <section className="section">
        <div className="container">
          <motion.div
            className="phonetics-toggle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ maxWidth: '500px', margin: '0 auto 3rem' }}
          >
            <motion.div
              className={`toggle-switch ${showTransliteration ? 'active' : ''}`}
              onClick={() => setShowTransliteration(!showTransliteration)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            />
            <span className="toggle-label">
              {showTransliteration ? 'Showing transliteration' : 'Transliteration hidden'}
            </span>
          </motion.div>

          {/* Chants Grid */}
          <div className="chants-grid">
            {phoneticsChants.map((chant: Chant, index: number) => (
              <motion.div
                key={chant.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div
                  className="chant-card"
                  whileHover={{ 
                    y: -8,
                    boxShadow: "0 20px 40px rgba(139, 38, 53, 0.15)"
                  }}
                  onClick={() => setSelectedChant(chant)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="chant-card-header">
                    <div style={{ flex: 1 }}>
                      <h3 className="chant-card-title">{chant.title}</h3>
                      {chant.titleGreek && (
                        <p className="chant-card-subtitle">{chant.titleGreek}</p>
                      )}
                    </div>
                    <motion.div 
                      className="chant-card-icon"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      🔤
                    </motion.div>
                  </div>

                  <div className="chant-card-badges">
                    <span className="badge badge-burgundy">{chant.tone}</span>
                    <span className="badge badge-gold">{chant.service}</span>
                    <span className="badge badge-purple">Arabic</span>
                  </div>

                  <AnimatePresence>
                    {showTransliteration && chant.phoneticsText && (
                      <motion.div
                        className="transliteration-text"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ marginTop: '1rem', fontSize: '0.9rem' }}
                      >
                        {chant.phoneticsText}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="chant-card-actions">
                    <motion.button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewChant(chant.id);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      View Full
                    </motion.button>
                    <motion.button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Download feature coming soon!');
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Download
                      <span className="coming-soon-badge">Soon</span>
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Info Box */}
          <motion.div
            style={{
              marginTop: '4rem',
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(74, 48, 84, 0.05), rgba(139, 38, 53, 0.05))',
              borderRadius: '16px',
              border: '1px solid var(--border-light)',
              textAlign: 'center'
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 style={{ marginBottom: '1rem' }}>☦ About Phonetic Transliteration</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              Our phonetic transliterations are designed to help non-Arabic speakers learn and sing 
              these beautiful chants. The transliteration follows standard romanization principles, 
              with capitalized syllables indicating emphasis.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick View Modal */}
      <AnimatePresence>
        {selectedChant && (
          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedChant(null)}
          >
            <motion.div
              style={{
                background: 'var(--bg-surface)',
                borderRadius: '24px',
                padding: '2rem',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto'
              }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginBottom: '0.5rem' }}>{selectedChant.title}</h2>
              {selectedChant.titleGreek && (
                <p style={{ 
                  fontFamily: 'var(--font-accent)', 
                  fontSize: '1.25rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem'
                }}>
                  {selectedChant.titleGreek}
                </p>
              )}
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-burgundy">{selectedChant.tone}</span>
                <span className="badge badge-gold">{selectedChant.service}</span>
                <span className="badge badge-purple">Arabic</span>
              </div>

              {selectedChant.phoneticsText && (
                <div className="transliteration-text" style={{ marginBottom: '1.5rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Phonetic Transliteration:</strong>
                  {selectedChant.phoneticsText}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <motion.button
                  className="btn btn-secondary"
                  onClick={() => setSelectedChant(null)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Close
                </motion.button>
                <motion.button
                  className="btn btn-primary"
                  onClick={() => {
                    onViewChant(selectedChant.id);
                    setSelectedChant(null);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Full Page
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhoneticsPage;
