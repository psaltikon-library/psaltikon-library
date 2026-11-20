import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Chant } from '../types';
import { supabase } from '../lib/supabase';
import { saveChant, unsaveChant } from '../utils/savedChants';
import { neumeForTone } from '../utils/toneNeumes';
import { TONE_COLORS, TONE_NAMES, toneNumber } from '../utils/tones';

interface ChantCardProps {
  chant: Chant;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSave?: (id: string) => void;
  onUnsave?: (id: string) => void;
  isSaved?: boolean;
  showSaveButton?: boolean;
  index?: number;
  /** When provided, the booklet button toggles this chant in the booklet selection. */
  onToggleBooklet?: (id: string) => void;
  isInBooklet?: boolean;
}

const ChantCard = ({ chant, onView, onEdit, onDelete, onSave, onUnsave, isSaved = false, showSaveButton = true, index = 0, onToggleBooklet, isInBooklet = false }: ChantCardProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [status, setStatus] = useState(((chant as any).status || 'pending').toString().toLowerCase());
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSavedState, setIsSavedState] = useState(isSaved);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsAdmin(localStorage.getItem('psaltikon_admin_authed') === 'true');
  }, []);

  useEffect(() => {
    setStatus(((chant as any).status || 'pending').toString().toLowerCase());
  }, [chant]);

  useEffect(() => {
    setIsSavedState(isSaved);
  }, [isSaved]);

  const handleComingSoon = (action: string) => {
    alert(`${action} feature coming soon! This will be available in a future update.`);
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

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);

    try {
      if (isSavedState) {
        await unsaveChant(chant.id);
        setIsSavedState(false);
        onUnsave?.(chant.id);
      } else {
        await saveChant(chant.id);
        setIsSavedState(true);
        onSave?.(chant.id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save chant.';
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const number = toneNumber(chant.tone);
  const neume = neumeForTone(chant.tone);
  const base = number ? TONE_COLORS[number - 1] : null;
  // "Tone 5 (Friyos)": the bracketed name is the more exact one; otherwise the traditional name.
  const variant = chant.tone?.match(/\(([^)]+)\)/)?.[1]?.trim();
  const rubricLabel = number ? `Tone ${number}` : chant.tone?.trim() || 'No tone';
  const rubricName = number ? variant || TONE_NAMES[number - 1] : null;
  const meta = [chant.part, chant.service, chant.language].filter(Boolean).join(' \u00b7 ');

  const style = {
    ['--tone' as string]: base ?? '#7E796F',
    ['--n' as string]: neume ? `url(${neume})` : undefined,
  } as React.CSSProperties;

  return (
    <motion.article
      className={[
        'chant-entry',
        isAdmin ? 'has-admin' : '',
        isSavedState ? 'is-saved' : '',
        isInBooklet ? 'is-picked' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      data-tone={number ?? 'none'}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="chant-entry__spine" aria-hidden="true">
        {neume && <span className="chant-entry__neume" />}
      </div>

      <div className="chant-entry__main">
        <header className="chant-entry__head">
          <p className="chant-entry__rubric">
            <b>{rubricLabel}</b>
            {rubricName && <em>{rubricName}</em>}
          </p>
        </header>

        <h3 className="chant-entry__title">
          <button
            type="button"
            className="chant-entry__link"
            title={chant.title}
            onClick={() => onView(chant.id)}
          >
            {chant.title}
          </button>
        </h3>

        <p className="chant-entry__meta">{meta}</p>

        <p className="chant-entry__foot">
          <span className="chant-entry__feast">{chant.feast}</span>
          {chant.hasPhonetics && <span className="chant-entry__tag">Phonetics</span>}
        </p>

        <footer className="chant-entry__actions">
          {showSaveButton && (
            <button
              type="button"
              className="chant-entry__act"
              onClick={handleSaveClick}
              disabled={isSaving}
              aria-pressed={isSavedState}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill={isSavedState ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
                <polygon points="12 3 14.9 9 21.5 9.8 16.6 14.3 17.9 21 12 17.7 6.1 21 7.4 14.3 2.5 9.8 9.1 9" />
              </svg>
              {isSavedState ? 'Saved' : 'Save'}
            </button>
          )}
          <button
            type="button"
            className="chant-entry__act"
            onClick={() => {
              if (onToggleBooklet) {
                onToggleBooklet(chant.id);
                return;
              }
              handleComingSoon('Booklet');
            }}
            aria-pressed={onToggleBooklet ? isInBooklet : undefined}
          >
            {onToggleBooklet && isInBooklet ? (
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 12 10 18 20 6" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
            {onToggleBooklet && isInBooklet ? 'In booklet' : 'Add to booklet'}
          </button>
        </footer>

        {isAdmin && (
          <div className="chant-entry__admin">
            <label>
              Status
              <select
                value={status}
                disabled={isUpdatingStatus}
                aria-label="Status"
                onChange={(e) => void handleStatusChange(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="hidden">Hidden</option>
              </select>
            </label>
            <span className="grow" />
            <button type="button" onClick={handleEditClick}>
              Edit
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>
      {showDeleteConfirm &&
        createPortal(
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
      , document.body)}
    </motion.article>
  );
};

export default ChantCard;
