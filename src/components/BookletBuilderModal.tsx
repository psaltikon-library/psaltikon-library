import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Booklet, Chant, Page } from '../types';
import { supabase } from '../lib/supabase';
import { addChantToBooklet, createBooklet, listMyBooklets } from '../utils/booklets';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Chants currently selected in the library, in selection order. */
  selectedChants: Chant[];
  onRemoveChant: (id: string) => void;
  onClearSelection: () => void;
  onNavigate?: (page: Page) => void;
};

/**
 * A compact stand-in for the Booklets page: shows the current selection, the
 * user's existing booklets to append to, and a quick create form.
 */
export default function BookletBuilderModal({
  open,
  onClose,
  selectedChants,
  onRemoveChant,
  onClearSelection,
  onNavigate,
}: Props) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [myBooklets, setMyBooklets] = useState<Booklet[]>([]);
  const [loadingBooklets, setLoadingBooklets] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;

    let active = true;

    const load = async () => {
      setLoadingBooklets(true);
      setNotice(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;
      setIsAuthed(!!user);
      setAuthChecked(true);

      if (user) {
        const booklets = await listMyBooklets();
        if (active) setMyBooklets(booklets);
      }

      if (active) setLoadingBooklets(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const chantIds = selectedChants.map((chant) => chant.id);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || chantIds.length === 0) return;

    try {
      setBusy('create');
      setNotice(null);
      await createBooklet({ title, isPublic: false, chantIds });
      setNewTitle('');
      setMyBooklets(await listMyBooklets());
      onClearSelection();
      setNotice({ kind: 'success', text: `Created "${title}" with ${chantIds.length} chants.` });
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to create booklet.',
      });
    } finally {
      setBusy(null);
    }
  };

  const handleAddToBooklet = async (booklet: Booklet) => {
    if (chantIds.length === 0) return;

    try {
      setBusy(booklet.id);
      setNotice(null);
      for (const chantId of chantIds) {
        await addChantToBooklet(booklet.id, chantId);
      }
      setMyBooklets(await listMyBooklets());
      onClearSelection();
      setNotice({
        kind: 'success',
        text: `Added ${chantIds.length} ${chantIds.length === 1 ? 'chant' : 'chants'} to "${booklet.title}".`,
      });
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to add to booklet.',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="auth-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="auth-modal-backdrop"
            onClick={onClose}
            aria-label="Close booklet builder"
          />

          <motion.div
            className="auth-modal booklet-builder"
            role="dialog"
            aria-modal="true"
            aria-label="Booklet builder"
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 14, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <div className="auth-modal-header">
              <div className="auth-modal-brand">
                <div className="auth-modal-icon">📚</div>
                <div>
                  <div className="auth-modal-app">Booklet Builder</div>
                  <div className="auth-modal-subtitle">
                    {selectedChants.length === 0
                      ? 'Select chants in the library to start a booklet.'
                      : `${selectedChants.length} ${selectedChants.length === 1 ? 'chant' : 'chants'} selected.`}
                  </div>
                </div>
              </div>

              <button type="button" onClick={onClose} className="auth-modal-close" aria-label="Close">
                ✕
              </button>
            </div>

            <div className="auth-modal-body booklet-builder__body">
              {notice && (
                <div className={`booklet-builder__notice booklet-builder__notice--${notice.kind}`}>
                  {notice.text}
                </div>
              )}

              <section className="booklet-builder__section">
                <div className="booklet-builder__section-head">
                  <h3>Selected chants</h3>
                  {selectedChants.length > 0 && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={onClearSelection}>
                      Clear all
                    </button>
                  )}
                </div>

                {selectedChants.length === 0 ? (
                  <p className="booklet-builder__empty">
                    Nothing selected yet. Use <strong>+ Booklet</strong> on any chant to add it here.
                  </p>
                ) : (
                  <ol className="booklet-builder__selection">
                    {selectedChants.map((chant, index) => (
                      <li key={chant.id} className="booklet-builder__selection-row">
                        <span className="booklet-builder__position">{index + 1}</span>
                        <span className="booklet-builder__chant-title">{chant.title}</span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => onRemoveChant(chant.id)}
                          aria-label={`Remove ${chant.title} from selection`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              {authChecked && !isAuthed ? (
                <section className="booklet-builder__section">
                  <p className="booklet-builder__empty">
                    Log in to save booklets to your account.
                  </p>
                </section>
              ) : (
                <>
                  <section className="booklet-builder__section">
                    <div className="booklet-builder__section-head">
                      <h3>New booklet</h3>
                    </div>
                    <form className="booklet-builder__create" onSubmit={handleCreate}>
                      <input
                        className="auth-input"
                        type="text"
                        placeholder="Booklet title"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={busy === 'create' || !newTitle.trim() || selectedChants.length === 0}
                      >
                        {busy === 'create' ? 'Creating…' : 'Create'}
                      </button>
                    </form>
                  </section>

                  <section className="booklet-builder__section">
                    <div className="booklet-builder__section-head">
                      <h3>My booklets</h3>
                      {onNavigate && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            onClose();
                            onNavigate('booklets');
                          }}
                        >
                          Open full page →
                        </button>
                      )}
                    </div>

                    {loadingBooklets ? (
                      <p className="booklet-builder__empty">Loading your booklets…</p>
                    ) : myBooklets.length === 0 ? (
                      <p className="booklet-builder__empty">
                        No booklets yet. Create one above.
                      </p>
                    ) : (
                      <div className="booklet-builder__list">
                        {myBooklets.map((booklet) => (
                          <div key={booklet.id} className="booklet-builder__row">
                            <div className="booklet-builder__row-main">
                              <span className="booklet-builder__row-title">{booklet.title}</span>
                              <span className="booklet-builder__row-meta">
                                {booklet.chantCount ?? 0}{' '}
                                {(booklet.chantCount ?? 0) === 1 ? 'chant' : 'chants'}
                                {booklet.is_public ? ' · Public' : ' · Private'}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              disabled={busy === booklet.id || selectedChants.length === 0}
                              onClick={() => void handleAddToBooklet(booklet)}
                            >
                              {busy === booklet.id ? 'Adding…' : 'Add selected'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
