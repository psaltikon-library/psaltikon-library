import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Chant } from '../types';

interface PhoneticsPageProps {
  onViewChant: (id: string) => void;
}

const getPhoneticsPdfPath = (chant: Chant) => {
  const anyChant = chant as any;
  return (
    anyChant.phonetics_pdf_path ||
    anyChant.phoneticsPdfPath ||
    anyChant.phoneticsPdfURL ||
    anyChant.phoneticsPdfUrl ||
    ''
  );
};

const getPhoneticsPdfUrl = (chant: Chant) => {
  const pdfPath = getPhoneticsPdfPath(chant);
  if (!pdfPath) return '';

  if (
    /^https?:\/\//i.test(pdfPath) ||
    pdfPath.startsWith('blob:') ||
    pdfPath.startsWith('data:')
  ) {
    return pdfPath;
  }

  if (pdfPath.startsWith('/')) {
    return pdfPath;
  }

  const { data } = supabase.storage.from('phonetic_files').getPublicUrl(pdfPath);
  return data?.publicUrl || '';
};

const PhoneticsPage = ({ onViewChant }: PhoneticsPageProps) => {
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [selectedChant, setSelectedChant] = useState<Chant | null>(null);

  const [phoneticsChants, setPhoneticsChants] = useState<Chant[]>([]);
  const [isLoadingChants, setIsLoadingChants] = useState(true);
  const [chantsError, setChantsError] = useState('');

  useEffect(() => {
    const loadPhoneticsChants = async () => {
      setIsLoadingChants(true);
      setChantsError('');

      const { data, error } = await supabase
        .from('chants')
        .select('*')
        .eq('has_phonetics', true)
        .order('created_at', { ascending: false });

      if (error) {
        setPhoneticsChants([]);
        setChantsError(error.message || 'Failed to load phonetics chants.');
        setIsLoadingChants(false);
        return;
      }

      setPhoneticsChants((data as Chant[]) || []);
      setIsLoadingChants(false);
    };

    void loadPhoneticsChants();
  }, []);

  const visiblePhoneticsChants = phoneticsChants.filter(
    (chant: Chant) => !!((chant as any).has_phonetics || (chant as any).hasPhonetics)
  );

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

          {isLoadingChants ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'var(--bg-surface)',
                borderRadius: '16px',
                border: '1px solid var(--border-light)',
              }}
            >
              <div
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '1rem',
                  opacity: 0.35,
                }}
              >
                ⏳
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>Loading phonetics chants...</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Pulling chants with phonetics from the library database.
              </p>
            </motion.div>
          ) : chantsError ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'var(--bg-surface)',
                borderRadius: '16px',
                border: '1px solid var(--border-light)',
              }}
            >
              <div
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '1rem',
                  opacity: 0.35,
                }}
              >
                ⚠️
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>Could not load phonetics chants</h3>
              <p style={{ color: 'var(--text-muted)' }}>{chantsError}</p>
            </motion.div>
          ) : visiblePhoneticsChants.length > 0 ? (
            <div className="chants-grid">
              {visiblePhoneticsChants.map((chant: Chant, index: number) => {
                const greekTitle = (chant as any).titleGreek || (chant as any).title_greek;
                const phoneticsText = (chant as any).phoneticsText || (chant as any).phonetics_text;
                const chantLanguage = chant.language || 'Arabic';
                const phoneticsPdfUrl = getPhoneticsPdfUrl(chant);

                return (
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
                        boxShadow: '0 20px 40px rgba(139, 38, 53, 0.15)'
                      }}
                      onClick={() => setSelectedChant(chant)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="chant-card-header">
                        <div style={{ flex: 1 }}>
                          <h3 className="chant-card-title">{chant.title}</h3>
                          {greekTitle && (
                            <p className="chant-card-subtitle">{greekTitle}</p>
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
                        {chant.tone && <span className="badge badge-burgundy">{chant.tone}</span>}
                        {chant.service && <span className="badge badge-gold">{chant.service}</span>}
                        <span className="badge badge-purple">{chantLanguage}</span>
                      </div>

                      <AnimatePresence>
                        {showTransliteration && phoneticsText && (
                          <motion.div
                            className="transliteration-text"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ marginTop: '1rem', fontSize: '0.9rem' }}
                          >
                            {phoneticsText}
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
                            if (!phoneticsPdfUrl) {
                              alert('No phonetics PDF is linked to this chant yet.');
                              return;
                            }
                            window.open(phoneticsPdfUrl, '_blank', 'noopener,noreferrer');
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Open PDF
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'var(--bg-surface)',
                borderRadius: '16px',
                border: '1px solid var(--border-light)',
              }}
            >
              <div
                style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                  opacity: 0.3,
                }}
              >
                🔤
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>No phonetics chants found</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Add chants with `has_phonetics` set to true to have them appear here.
              </p>
            </motion.div>
          )}

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
              {((selectedChant as any).titleGreek || (selectedChant as any).title_greek) && (
                <p style={{
                  fontFamily: 'var(--font-accent)',
                  fontSize: '1.25rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem'
                }}>
                  {(selectedChant as any).titleGreek || (selectedChant as any).title_greek}
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {selectedChant.tone && <span className="badge badge-burgundy">{selectedChant.tone}</span>}
                {selectedChant.service && <span className="badge badge-gold">{selectedChant.service}</span>}
                <span className="badge badge-purple">{selectedChant.language || 'Arabic'}</span>
              </div>

              {((selectedChant as any).phoneticsText || (selectedChant as any).phonetics_text) && (
                <div className="transliteration-text" style={{ marginBottom: '1.5rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Phonetic Transliteration:</strong>
                  {(selectedChant as any).phoneticsText || (selectedChant as any).phonetics_text}
                </div>
              )}
              {(() => {
                const selectedPhoneticsPdfUrl = getPhoneticsPdfUrl(selectedChant);
                return selectedPhoneticsPdfUrl ? (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <a
                      href={selectedPhoneticsPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open Phonetics PDF
                    </a>
                  </div>
                ) : null;
              })()}

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
