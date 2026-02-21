import { motion } from 'framer-motion';
import { mockChants, phoneticsChants, compositionsChants } from '../data/mockChants';
import { Chant } from '../types';

interface ChantDetailPageProps {
  chantId: string | null;
  onBack: () => void;
}

const ChantDetailPage = ({ chantId, onBack }: ChantDetailPageProps) => {
  const allChants = [...mockChants, ...phoneticsChants, ...compositionsChants];
  const chant = allChants.find((c: Chant) => c.id === chantId);

  const handleComingSoon = (action: string) => {
    alert(`${action} feature coming soon! This will be available in a future update.`);
  };

  if (!chant) {
    return (
      <div className="detail-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', padding: '4rem' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }}>📜</div>
          <h2>Chant not found</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            The requested chant could not be found.
          </p>
          <motion.button
            className="btn btn-primary"
            style={{ marginTop: '2rem' }}
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back to Library
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      {/* Breadcrumb */}
      <motion.div 
        className="detail-breadcrumb"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.a 
          onClick={onBack}
          style={{ cursor: 'pointer' }}
          whileHover={{ color: 'var(--burgundy)' }}
        >
          Library
        </motion.a>
        <span>/</span>
        <span>{chant.part}</span>
        <span>/</span>
        <span style={{ color: 'var(--text-primary)' }}>{chant.title}</span>
      </motion.div>

      {/* Header */}
      <motion.div 
        className="detail-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.h1 
          className="detail-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {chant.title}
        </motion.h1>
        
        {chant.titleGreek && (
          <motion.p 
            style={{ 
              fontFamily: 'var(--font-accent)', 
              fontSize: '1.5rem', 
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              marginBottom: '1.5rem'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {chant.titleGreek}
          </motion.p>
        )}

        <motion.div 
          className="detail-meta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.span 
            className="badge badge-burgundy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.5 }}
          >
            {chant.tone}
          </motion.span>
          <motion.span 
            className="badge badge-gold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.55 }}
          >
            {chant.service}
          </motion.span>
          <motion.span 
            className="badge badge-purple"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.6 }}
          >
            {chant.part}
          </motion.span>
          <motion.span 
            className="badge badge-blue"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.65 }}
          >
            {chant.language}
          </motion.span>
          <motion.span 
            className="badge badge-outline"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.7 }}
          >
            {chant.feast}
          </motion.span>
        </motion.div>

        <motion.div 
          className="detail-actions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            className="btn btn-primary"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleComingSoon('Download PDF')}
          >
            Download PDF
            <span className="coming-soon-badge">Soon</span>
          </motion.button>
          <motion.button
            className="btn btn-secondary"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleComingSoon('Add to Booklet')}
          >
            + Add to Booklet
            <span className="coming-soon-badge">Soon</span>
          </motion.button>
          <motion.button
            className="btn btn-ghost"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
          >
            ← Back
          </motion.button>
        </motion.div>
      </motion.div>

      {/* PDF Viewer */}
      <motion.div 
        className="pdf-viewer"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="pdf-viewer-header">
          <span className="pdf-viewer-title">📄 {chant.title}.pdf</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <motion.button
              className="btn btn-ghost btn-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔍 Zoom
            </motion.button>
            <motion.button
              className="btn btn-ghost btn-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ⬇ Download
            </motion.button>
          </div>
        </div>
        <div className="pdf-viewer-content">
          <motion.div 
            className="pdf-placeholder"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div 
              className="pdf-placeholder-icon"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 4,
                ease: "easeInOut"
              }}
            >
              𝄞
            </motion.div>
            <p className="pdf-placeholder-text">
              Byzantine notation manuscript preview
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              PDF viewer will display here
            </p>
            
            {/* Mock manuscript lines */}
            <motion.div
              style={{
                marginTop: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '80%',
                maxWidth: '400px'
              }}
            >
              {[1, 0.7, 0.9, 0.6, 0.8].map((width, i) => (
                <motion.div
                  key={i}
                  style={{
                    height: '8px',
                    background: 'var(--border)',
                    borderRadius: '4px',
                    width: `${width * 100}%`
                  }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 0.5 }}
                  transition={{ delay: 0.8 + (i * 0.1), duration: 0.5 }}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Phonetics Section (if available) */}
      {chant.hasPhonetics && chant.phoneticsText && (
        <motion.div
          style={{ marginTop: '2rem' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 style={{ marginBottom: '1rem' }}>Phonetic Transliteration</h3>
          <div className="transliteration-text">
            {chant.phoneticsText}
          </div>
        </motion.div>
      )}

      {/* Related Chants */}
      <motion.div
        style={{ marginTop: '4rem' }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <h3 style={{ marginBottom: '1.5rem' }}>Related Chants</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          {mockChants
            .filter((c: Chant) => c.id !== chant.id && (c.service === chant.service || c.tone === chant.tone))
            .slice(0, 3)
            .map((relatedChant: Chant, index: number) => (
              <motion.div
                key={relatedChant.id}
                style={{
                  padding: '1rem',
                  background: 'var(--bg-surface)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer'
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  y: -4,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}
              >
                <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{relatedChant.title}</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-burgundy" style={{ fontSize: '0.7rem' }}>{relatedChant.tone}</span>
                  <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>{relatedChant.service}</span>
                </div>
              </motion.div>
            ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ChantDetailPage;
