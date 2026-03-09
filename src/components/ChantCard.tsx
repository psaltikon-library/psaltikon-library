import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Chant } from '../types';

interface ChantCardProps {
  chant: Chant;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  index?: number;
}

const getMartyriaForTone = (tone?: string | null) => {
  const normalized = (tone || '').trim().toLowerCase();

  if (
    normalized === 'tone 1' ||
    normalized === 'echos 1' ||
    normalized === 'mode 1' ||
    normalized === 'first tone'
  ) {
    return '𝀈';
  }

  if (
    normalized === 'tone 2' ||
    normalized === 'echos 2' ||
    normalized === 'mode 2' ||
    normalized === 'second tone'
  ) {
    return '𝀉';
  }

  if (
    normalized === 'tone 3' ||
    normalized === 'echos 3' ||
    normalized === 'mode 3' ||
    normalized === 'third tone'
  ) {
    return '𝀊';
  }

  if (
    normalized === 'tone 4' ||
    normalized === 'echos 4' ||
    normalized === 'mode 4' ||
    normalized === 'fourth tone'
  ) {
    return '𝀋';
  }

  if (
    normalized === 'tone 5' ||
    normalized === 'plagal 1' ||
    normalized === 'plagal of the first' ||
    normalized === 'echos plagios 1' ||
    normalized === 'mode 5'
  ) {
    return '𝀌';
  }

  if (
    normalized === 'tone 6' ||
    normalized === 'plagal 2' ||
    normalized === 'plagal of the second' ||
    normalized === 'echos plagios 2' ||
    normalized === 'mode 6'
  ) {
    return '𝀍';
  }

  if (
    normalized === 'tone 7' ||
    normalized === 'grave tone' ||
    normalized === 'varys' ||
    normalized === 'echos varys' ||
    normalized === 'mode 7'
  ) {
    return '𝀎';
  }

  if (
    normalized === 'tone 8' ||
    normalized === 'plagal 4' ||
    normalized === 'plagal of the fourth' ||
    normalized === 'echos plagios 4' ||
    normalized === 'mode 8'
  ) {
    return '𝀏';
  }

  return '𝄞';
};

const ChantCard = ({ chant, onView, onEdit, index = 0 }: ChantCardProps) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(localStorage.getItem('psaltikon_admin_authed') === 'true');
  }, []);

  const handleComingSoon = (action: string) => {
    alert(`${action} feature coming soon! This will be available in a future update.`);
  };

  const chantStatus = ((chant as any).status || 'pending').toString();
  const normalizedStatus = chantStatus.toLowerCase();

  const statusBadgeClass =
    normalizedStatus === 'approved'
      ? 'badge badge-gold'
      : normalizedStatus === 'rejected'
        ? 'badge badge-burgundy'
        : 'badge badge-purple';

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(chant.id);
      return;
    }

    alert('Edit chant feature coming soon! This will be available in a future update.');
  };

  const martyriaSymbol = getMartyriaForTone(chant.tone);

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
      <div className="chant-card-header" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <h3 className="chant-card-title">
              {chant.title}
            </h3>
            <motion.div 
              className="chant-card-icon"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
              title={chant.tone || 'Tone not set'}
              style={{
                fontSize: '1.35rem',
                lineHeight: 1,
                flexShrink: 0,
                fontFamily: '"Segoe UI Symbol", "Noto Sans Symbols 2", "Noto Music", serif',
              }}
            >
              {martyriaSymbol}
            </motion.div>
          </div>
          {isAdmin && (
            <div style={{ marginTop: '0.45rem' }}>
              <span className={statusBadgeClass} style={{ textTransform: 'capitalize' }}>
                {chantStatus}
              </span>
            </div>
          )}
          {chant.titleGreek && (
            <p className="chant-card-subtitle">{chant.titleGreek}</p>
          )}
        </div>
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
        {isAdmin && (
          <motion.button
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick();
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Edit
          </motion.button>
        )}
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
