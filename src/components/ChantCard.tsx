import { motion } from 'framer-motion';
import { Chant } from '../types';

interface ChantCardProps {
  chant: Chant;
  onView: (id: string) => void;
  index?: number;
}

const ChantCard = ({ chant, onView, index = 0 }: ChantCardProps) => {
  const handleComingSoon = (action: string) => {
    alert(`${action} feature coming soon! This will be available in a future update.`);
  };

  return (
    <motion.div
      className="chant-card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{ 
        y: -6,
        transition: { duration: 0.3 }
      }}
      onClick={() => onView(chant.id)}
    >
      <div className="chant-card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="chant-card-title">
            {chant.title}
          </h3>
          {chant.titleGreek && (
            <p className="chant-card-subtitle">{chant.titleGreek}</p>
          )}
        </div>
        <motion.div 
          className="chant-card-icon"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          𝄞
        </motion.div>
      </div>

      <div className="chant-card-badges">
        <span className="badge badge-burgundy">
          {chant.tone}
        </span>
        <span className="badge badge-gold">
          {chant.service}
        </span>
        <span className="badge badge-outline">
          {chant.part}
        </span>
        {chant.hasPhonetics && (
          <span className="badge badge-purple">
            Phonetics
          </span>
        )}
      </div>

      <p style={{ 
        fontSize: '0.95rem', 
        color: 'var(--text-muted)', 
        marginTop: '0.75rem',
        marginBottom: 0 
      }}>
        {chant.feast}
      </p>

      <div className="chant-card-actions">
        <motion.button
          className="btn btn-primary btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            onView(chant.id);
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          View Chant
        </motion.button>
        <motion.button
          className="btn btn-secondary btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleComingSoon('Download');
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Download
          <span className="coming-soon-badge">Soon</span>
        </motion.button>
        <motion.button
          className="btn btn-ghost btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleComingSoon('Add to Booklet');
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{ marginLeft: 'auto' }}
        >
          + Booklet
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ChantCard;
