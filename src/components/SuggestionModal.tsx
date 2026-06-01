import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface SuggestionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function SuggestionModal({ open, onClose, onSubmitted }: SuggestionModalProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setTitle('');
      setMessage('');
      setIsSubmitting(false);
      setError('');
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setError('You must be logged in to submit a suggestion.');
        setIsSubmitting(false);
        return;
      }

      const trimmedTitle = title.trim();
      const trimmedMessage = message.trim();

      if (!trimmedTitle || !trimmedMessage) {
        setError('Please enter both a title and a message.');
        setIsSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase.from('chant_suggestions').insert({
        submitted_by: user.id,
        title: trimmedTitle,
        message: trimmedMessage,
        status: 'new',
      });

      if (insertError) {
        setError(insertError.message || 'Failed to submit suggestion.');
        setIsSubmitting(false);
        return;
      }

      onSubmitted?.();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit suggestion.');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="auth-modal-overlay auth-modal-overlay--signup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="auth-modal-backdrop"
            onClick={onClose}
            aria-label="Close suggestion modal"
          />

          <motion.div
            className="auth-modal auth-modal--signup"
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 14, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <div className="auth-modal-header">
              <div className="auth-modal-brand">
                <div className="auth-modal-icon">💡</div>
                <div>
                  <div className="auth-modal-app">Psaltikon Library</div>
                  <div className="auth-modal-title">Suggest a Chant</div>
                  <div className="auth-modal-subtitle">
                    Send a request for a chant, feast, or service you want added.
                  </div>
                </div>
              </div>

              <button type="button" onClick={onClose} className="auth-modal-close" aria-label="Close">
                ✕
              </button>
            </div>

            <form className="auth-modal-body" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label">Suggestion Title</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="e.g. Resurrection Apolytikion for Tone 3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Details</label>
                <textarea
                  className="auth-input"
                  rows={5}
                  placeholder="Tell us what chant you would like to see and any details that would help."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ resize: 'vertical', minHeight: 120 }}
                />
              </div>

              {error && (
                <div style={{ color: 'var(--burgundy)', fontSize: '0.92rem', marginTop: '-0.25rem' }}>
                  {error}
                </div>
              )}

              <div className="auth-actions" style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
