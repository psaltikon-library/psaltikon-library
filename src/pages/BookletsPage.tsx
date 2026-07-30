import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Booklet, Chant } from '../types';
import BookletCard from '../components/BookletCard';
import BookletEditorModal from '../components/BookletEditorModal';
import { resolveChantsWithDevFallback } from '../utils/chantFallback';
import {
  deleteBooklet,
  getBookletWithChants,
  listMyBooklets,
  listPopularBooklets,
  recordBookletDownload,
  setBookletVisibility,
} from '../utils/booklets';
import { buildBookletPdf, downloadBytes } from '../utils/pdfBooklet';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const BookletsPage = () => {
  const [isAuthed, setIsAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [myBooklets, setMyBooklets] = useState<Booklet[]>([]);
  const [popularBooklets, setPopularBooklets] = useState<Booklet[]>([]);
  const [chants, setChants] = useState<Chant[]>([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editingBooklet, setEditingBooklet] = useState<Booklet | null>(null);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const showToast = (kind: 'success' | 'error', message: string) => {
    setToast({ kind, message });
    window.setTimeout(() => setToast(null), 6000);
  };

  const loadChants = async () => {
    const { data, error } = await supabase
      .from('chants')
      .select('*')
      .order('created_at', { ascending: false });
    setChants(resolveChantsWithDevFallback(error ? null : (data as Chant[] | null)));
  };

  const loadMine = async () => {
    setLoadingMine(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsAuthed(Boolean(user));
    setAuthChecked(true);
    if (user) {
      setMyBooklets(await listMyBooklets());
    } else {
      setMyBooklets([]);
    }
    setLoadingMine(false);
  };

  const loadPopular = async () => {
    setLoadingPopular(true);
    setPopularBooklets(await listPopularBooklets(8));
    setLoadingPopular(false);
  };

  useEffect(() => {
    void loadChants();
    void loadMine();
    void loadPopular();
  }, []);

  const openCreate = () => {
    setEditorMode('create');
    setEditingBooklet(null);
    setEditorOpen(true);
  };

  const openEdit = async (booklet: Booklet) => {
    const full = await getBookletWithChants(booklet.id);
    setEditorMode('edit');
    setEditingBooklet(full ?? booklet);
    setEditorOpen(true);
  };

  const handleSaved = async () => {
    setEditorOpen(false);
    await loadMine();
    await loadPopular();
    showToast('success', 'Booklet saved.');
  };

  const handleDelete = async (booklet: Booklet) => {
    if (!window.confirm(`Delete “${booklet.title}”? This cannot be undone.`)) return;
    try {
      await deleteBooklet(booklet.id);
      setMyBooklets((list) => list.filter((b) => b.id !== booklet.id));
      showToast('success', 'Booklet deleted.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete booklet.');
    }
  };

  const handleToggleVisibility = async (booklet: Booklet) => {
    const next = !booklet.is_public;
    setMyBooklets((list) =>
      list.map((b) => (b.id === booklet.id ? { ...b, is_public: next } : b))
    );
    try {
      await setBookletVisibility(booklet.id, next);
      showToast('success', next ? 'Booklet is now public.' : 'Booklet is now private.');
      await loadPopular();
    } catch (err) {
      setMyBooklets((list) =>
        list.map((b) => (b.id === booklet.id ? { ...b, is_public: booklet.is_public } : b))
      );
      showToast('error', err instanceof Error ? err.message : 'Failed to update visibility.');
    }
  };

  const handleDownload = async (booklet: Booklet) => {
    setDownloadingId(booklet.id);
    try {
      const full = booklet.chants ? booklet : await getBookletWithChants(booklet.id);
      const bookletChants = full?.chants ?? [];
      if (bookletChants.length === 0) {
        showToast('error', 'This booklet has no chants to compile.');
        return;
      }
      const { bytes, included, skipped } = await buildBookletPdf(
        booklet.title,
        booklet.author_name || 'Anonymous',
        bookletChants
      );
      if (included === 0) {
        showToast('error', 'None of the chant PDFs could be loaded.');
        return;
      }
      downloadBytes(bytes, booklet.title);
      void recordBookletDownload(booklet.id);
      showToast(
        'success',
        skipped.length > 0
          ? `Downloaded ${included} chant${included === 1 ? '' : 's'}. Skipped ${skipped.length} with no PDF.`
          : `Downloaded booklet (${included} chant${included === 1 ? '' : 's'}).`
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to build the booklet PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`booklet-toast booklet-toast--${toast.kind}`}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="page">
        <motion.header
          className="booklets-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <div>
            <h1 className="booklets-hero-title">Booklets</h1>
            <p className="booklets-hero-subtitle">
              Compile chants into a single PDF for services — keep them private or share them with the faithful.
            </p>
          </div>
          {isAuthed && (
            <button className="btn btn-primary btn-lg btn-nested" onClick={openCreate}>
              New Booklet
              <span className="btn-nested-icon" aria-hidden="true">
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </button>
          )}
        </motion.header>

        {/* ── My Booklets ── */}
        <section className="booklets-section">
          <div className="section-lead booklets-section-lead">
            <h2>My Booklets</h2>
          </div>

          {!authChecked || loadingMine ? (
            <div className="booklet-panel-note">Loading your booklets…</div>
          ) : !isAuthed ? (
            <div className="booklet-panel-note booklet-panel-cta">
              <span className="booklet-panel-icon" aria-hidden="true">☩</span>
              <h3>Log in to build booklets</h3>
              <p>Sign in to create your own booklets and keep them private or public.</p>
            </div>
          ) : myBooklets.length === 0 ? (
            <div className="booklet-panel-note booklet-panel-cta">
              <span className="booklet-panel-icon" aria-hidden="true">☩</span>
              <h3>No booklets yet</h3>
              <p>Create your first booklet and add chants for an upcoming service.</p>
              <button className="btn btn-primary" onClick={openCreate}>
                Create a booklet
              </button>
            </div>
          ) : (
            <div className="booklets-grid">
              {myBooklets.map((booklet, index) => (
                <BookletCard
                  key={booklet.id}
                  booklet={booklet}
                  variant="mine"
                  index={index}
                  downloading={downloadingId === booklet.id}
                  onDownload={handleDownload}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggleVisibility={handleToggleVisibility}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Popular Booklets ── */}
        <section className="booklets-section">
          <div className="section-lead booklets-section-lead">
            <h2>Popular Booklets</h2>
            <p>Collections shared by others in the community.</p>
          </div>

          {loadingPopular ? (
            <div className="booklet-panel-note">Loading popular booklets…</div>
          ) : popularBooklets.length === 0 ? (
            <div className="booklet-panel-note">No public booklets yet. Be the first to share one.</div>
          ) : (
            <div className="booklets-grid">
              {popularBooklets.map((booklet, index) => (
                <BookletCard
                  key={booklet.id}
                  booklet={booklet}
                  variant="popular"
                  index={index}
                  downloading={downloadingId === booklet.id}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <BookletEditorModal
        open={editorOpen}
        mode={editorMode}
        booklet={editingBooklet}
        chants={chants}
        onClose={() => setEditorOpen(false)}
        onSaved={handleSaved}
      />
    </>
  );
};

export default BookletsPage;
