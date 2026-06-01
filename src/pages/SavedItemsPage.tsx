import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Chant } from '../types';
import ChantCard from '../components/ChantCard';
import { getSavedChants, unsaveChant } from '../utils/savedChants';

interface SavedItemsPageProps {
  onViewChant: (id: string) => void;
}

const SavedItemsPage = ({ onViewChant }: SavedItemsPageProps) => {
  const [savedChants, setSavedChants] = useState<Chant[]>([]);
  const [isLoadingChants, setIsLoadingChants] = useState(true);
  const [chantsError, setChantsError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const notificationTimerRef = useState<{ current: number | null }>({ current: null })[0];

  const showNotification = (message: string) => {
    setNotificationMessage(message);

    if (notificationTimerRef.current) {
      window.clearTimeout(notificationTimerRef.current);
    }

    notificationTimerRef.current = window.setTimeout(() => {
      setNotificationMessage('');
      notificationTimerRef.current = null;
    }, 10000);
  };

  useEffect(() => {
    const loadSavedChants = async () => {
      setIsLoadingChants(true);
      setChantsError('');

      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setIsAuthenticated(false);
        setChantsError('You must be logged in to view saved items.');
        setIsLoadingChants(false);
        return;
      }

      setIsAuthenticated(true);

      try {
        const chants = await getSavedChants();
        setSavedChants(chants);
      } catch (error) {
        setChantsError(error instanceof Error ? error.message : 'Failed to load saved chants.');
        setSavedChants([]);
      } finally {
        setIsLoadingChants(false);
      }
    };

    void loadSavedChants();
  }, []);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        window.clearTimeout(notificationTimerRef.current);
      }
    };
  }, [notificationTimerRef]);

  const handleUnsaveChant = async (chantId: string) => {
    try {
      await unsaveChant(chantId);
      setSavedChants((current) => current.filter((chant) => chant.id !== chantId));
      showNotification('Chant removed from saved items.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove chant from saved items.';
      alert(message);
    }
  };

  if (!isAuthenticated && !isLoadingChants) {
    return (
      <div className="page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', padding: '4rem 2rem' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }}>🔒</div>
          <h2>Login Required</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', maxWidth: '500px', margin: '0.5rem auto 0' }}>
            You must be logged in to view your saved items.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {notificationMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '1.25rem',
              right: '1.25rem',
              zIndex: 1100,
              maxWidth: '420px',
              width: 'calc(100vw - 2.5rem)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.18)',
              padding: '0.95rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                color: '#16a34a',
                fontSize: '0.95rem',
              }}
            >
              ✓
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  lineHeight: 1.25,
                }}
              >
                Success
              </div>
              <div
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  marginTop: '0.15rem',
                }}
              >
                {notificationMessage}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setNotificationMessage('');
                if (notificationTimerRef.current) {
                  window.clearTimeout(notificationTimerRef.current);
                  notificationTimerRef.current = null;
                }
              }}
              aria-label="Dismiss notification"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1rem',
                lineHeight: 1,
                padding: '0.1rem',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="page">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="chants-header">
            <div>
              <motion.h1
                style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Saved Items
              </motion.h1>

              <p className="chants-count">
                {savedChants.length} {savedChants.length === 1 ? 'chant' : 'chants'} saved
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isLoadingChants ? (
              <motion.div
                key="chants-loading"
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
                <h3 style={{ marginBottom: '0.5rem' }}>Loading your saved items...</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  Pulling your saved chants from the library.
                </p>
              </motion.div>
            ) : chantsError ? (
              <motion.div
                key="chants-error"
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
                <h3 style={{ marginBottom: '0.5rem' }}>Could not load saved items</h3>
                <p style={{ color: 'var(--text-muted)' }}>{chantsError}</p>
              </motion.div>
            ) : savedChants.length > 0 ? (
              <motion.div
                key="chants-grid"
                className="chants-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {savedChants.map((chant: Chant, index: number) => (
                  <ChantCard
                    key={chant.id}
                    chant={chant}
                    onView={onViewChant}
                    onDelete={() => handleUnsaveChant(chant.id)}
                    onUnsave={handleUnsaveChant}
                    isSaved={true}
                    showSaveButton={true}
                    index={index}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="chants-empty"
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
                  📚
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>No saved items yet</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  Save your favorite chants to access them quickly here
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};

export default SavedItemsPage;
