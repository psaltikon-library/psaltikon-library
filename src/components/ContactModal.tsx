import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const CONTACT_EMAIL = 'theorthodoxheritage@outlook.com';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Opens the visitor's email client with a pre-filled message to the project
 * inbox. Deliberately backend-free — it needs no auth, table, or migration, and
 * works for anonymous visitors. Can be upgraded later to store messages / send
 * server-side via the same pg_net → Resend path the chant submissions use.
 */
export default function ContactModal({ open, onClose }: ContactModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setEmail('');
    setMessage('');
    setError('');
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedMessage) {
      setError('Please enter your name and a message.');
      return;
    }

    const subject = `Psaltikon Library — message from ${trimmedName}`;
    const body = [
      `Name: ${trimmedName}`,
      trimmedEmail ? `Email: ${trimmedEmail}` : null,
      '',
      trimmedMessage,
    ]
      .filter((line) => line !== null)
      .join('\n');

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="auth-modal-overlay auth-modal-overlay--signup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Contact us"
        >
          <button
            type="button"
            className="auth-modal-backdrop"
            onClick={onClose}
            aria-label="Close contact form"
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
                <div className="auth-modal-icon">✉</div>
                <div>
                  <div className="auth-modal-app">Psaltikon Library</div>
                  <div className="auth-modal-title">Contact Us</div>
                  <div className="auth-modal-subtitle">
                    Share a chant, a correction, or a word of support.
                  </div>
                </div>
              </div>

              <button type="button" onClick={onClose} className="auth-modal-close" aria-label="Close">
                ✕
              </button>
            </div>

            <form className="auth-modal-body" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label">Name</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Email (optional)</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Message</label>
                <textarea
                  className="auth-input"
                  rows={5}
                  placeholder="How can we help?"
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

              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '-0.25rem 0 0' }}>
                This opens your email app with the message ready to send to {CONTACT_EMAIL}.
              </p>

              <div className="auth-actions" style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Send Message
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
