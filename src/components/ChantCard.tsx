import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Chant } from '../types';
import { supabase } from '../lib/supabase';

interface ChantCardProps {
  chant: Chant;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
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

const ChantCard = ({ chant, onView, onEdit, onDelete, index = 0 }: ChantCardProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [status, setStatus] = useState(((chant as any).status || 'pending').toString().toLowerCase());
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setIsAdmin(localStorage.getItem('psaltikon_admin_authed') === 'true');
  }, []);

  useEffect(() => {
    setStatus(((chant as any).status || 'pending').toString().toLowerCase());
  }, [chant]);

  const handleComingSoon = (action: string) => {
    alert(`${action} feature coming soon! This will be available in a future update.`);
  };

  const chantStatus = status;
  const statusBubbleStyles =
    chantStatus === 'approved'
      ? {
          background: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.28)',
          color: '#16a34a',
        }
      : chantStatus === 'hidden'
        ? {
            background: 'rgba(107, 70, 193, 0.12)',
            border: '1px solid rgba(107, 70, 193, 0.22)',
            color: 'var(--purple)',
          }
        : {
            background: 'rgba(107, 114, 128, 0.12)',
            border: '1px solid rgba(107, 114, 128, 0.22)',
            color: '#6b7280',
          };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(chant.id);
      return;
    }

    alert('Edit feature not available at the moment...');
  };

  const handleDeleteClick = async () => {
    setIsDeleting(true);

    const { error } = await supabase
      .from('chants')
      .delete()
      .eq('id', chant.id);

    if (error) {
      setIsDeleting(false);
      alert(error.message || 'Failed to delete chant.');
      return;
    }

    onDelete?.(chant.id);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const handleStatusChange = async (nextStatus: string) => {
    if (nextStatus === status) return;

    const previousStatus = status;
    setStatus(nextStatus);
    setIsUpdatingStatus(true);

    const { error } = await supabase
      .from('chants')
      .update({ status: nextStatus })
      .eq('id', chant.id);

    if (error) {
      setStatus(previousStatus);
      alert(error.message || 'Failed to update chant status.');
    }

    setIsUpdatingStatus(false);
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
            <div
              style={{
                marginTop: '0.45rem',
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <select
                value={chantStatus}
                disabled={isUpdatingStatus}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  void handleStatusChange(e.target.value);
                }}
                style={{
                  ...statusBubbleStyles,
                  textTransform: 'capitalize',
                  borderRadius: '999px',
                  padding: '0.35rem 2rem 0.35rem 0.8rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: isUpdatingStatus ? 'wait' : 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  lineHeight: 1.2,
                }}
              >
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="hidden">hidden</option>
              </select>
              <span
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  pointerEvents: 'none',
                  color: 'currentColor',
                  fontSize: '0.7rem',
                  opacity: 0.8,
                }}
              >
                ▾
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
          {chant.part}
        </span>
        <span className="badge badge-outline">
          {chant.service}
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
        {isAdmin && (
          <motion.button
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            disabled={isDeleting}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
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
      {showDeleteConfirm && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: '20px',
              boxShadow: '0 24px 80px rgba(15, 23, 42, 0.22)',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(127, 29, 29, 0.10)',
                  border: '1px solid rgba(127, 29, 29, 0.16)',
                  color: 'var(--burgundy)',
                  fontSize: '1.15rem',
                  flexShrink: 0,
                }}
              >
                🗑
              </div>
              <div>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.2,
                  }}
                >
                  Delete chant?
                </div>
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.2rem',
                  }}
                >
                  This action cannot be undone.
                </div>
              </div>
            </div>

            <p
              style={{
                margin: 0,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                fontSize: '0.95rem',
              }}
            >
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>&ldquo;{chant.title}&rdquo;</strong> from the library?
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '1.5rem',
              }}
            >
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDeleteClick();
                }}
                disabled={isDeleting}
                style={{
                  background: 'rgba(127, 29, 29, 0.12)',
                  borderColor: 'rgba(127, 29, 29, 0.2)',
                  color: 'var(--burgundy)',
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Chant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ChantCard;
