import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChantCard from '../components/ChantCard';
import UploadChantModal from '../components/UploadChantModal';
import BookletBuilderModal from '../components/BookletBuilderModal';
import AuthModal from '../components/AuthModal';
import { supabase } from '../lib/supabase';
import { Chant, Page } from '../types';
import { resolveChantsWithDevFallback } from '../utils/chantFallback';
import { getSavedChantIds } from '../utils/savedChants';
import { excludeHiddenChants } from '../utils/chantVisibility';
import {
  CHURCH_BOOKS,
  BOOK_DESCRIPTIONS,
  chantsAtPath,
  countByBook,
  foldersAtPath,
  groupByComposer,
  levelsForPath,
} from '../utils/churchBooks';

interface ServicesPageProps {
  onViewChant: (id: string) => void;
  onNavigate?: (page: Page) => void;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const BookIcon = () => (
  <svg {...iconProps} width={22} height={22}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </svg>
);

const FolderIcon = () => (
  <svg {...iconProps} width={20} height={20}>
    <path d="M4 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2Z" />
  </svg>
);

const ChevronIcon = () => (
  <svg {...iconProps} width={18} height={18}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const ServicesPage = ({ onViewChant, onNavigate }: ServicesPageProps) => {
  const [chants, setChants] = useState<Chant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [savedChantIds, setSavedChantIds] = useState<string[]>([]);

  // Directory position: the book being browsed and the folders opened inside it.
  const [book, setBook] = useState<string | null>(null);
  const [path, setPath] = useState<string[]>([]);

  // Editing (admins) and booklet building, mirroring the library page.
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingChant, setEditingChant] = useState<Chant | null>(null);
  const [bookletChantIds, setBookletChantIds] = useState<string[]>([]);
  const [bookletModalOpen, setBookletModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const loadChants = async () => {
      setIsLoading(true);
      setLoadError('');

      const { data, error } = await supabase
        .from('chants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setChants(resolveChantsWithDevFallback(null));
        setLoadError(import.meta.env.DEV ? '' : error.message || 'Failed to load chants.');
        setIsLoading(false);
        return;
      }

      setChants(excludeHiddenChants(resolveChantsWithDevFallback(data as Chant[] | null)));
      setIsLoading(false);
    };

    void loadChants();
  }, []);

  useEffect(() => {
    const loadSaved = async () => setSavedChantIds(await getSavedChantIds());
    void loadSaved();
  }, []);

  const bookCounts = useMemo(() => countByBook(chants), [chants]);
  const levels = book ? levelsForPath(book, path) : [];
  const atLeaf = book !== null && path.length >= levels.length;

  const folders = useMemo(
    () => (book && !atLeaf ? foldersAtPath(chants, book, path) : []),
    [chants, book, path, atLeaf]
  );

  const composerGroups = useMemo(
    () => (book && atLeaf ? groupByComposer(chantsAtPath(chants, book, path)) : []),
    [chants, book, path, atLeaf]
  );

  const handleEditChant = (chantId: string) => {
    setEditingChant(chants.find((chant) => chant.id === chantId) || null);
    setUploadModalOpen(true);
  };

  const handleSavedChant = (savedChant: Chant) => {
    setChants((current) =>
      current.some((chant) => chant.id === savedChant.id)
        ? current.map((chant) => (chant.id === savedChant.id ? savedChant : chant))
        : [savedChant, ...current]
    );
  };

  const toggleBookletChant = (chantId: string) => {
    setBookletChantIds((current) =>
      current.includes(chantId)
        ? current.filter((id) => id !== chantId)
        : [...current, chantId]
    );
  };

  const openBook = (name: string) => {
    setBook(name);
    setPath([]);
  };

  const openFolder = (name: string) => setPath((current) => [...current, name]);

  const goToRoot = () => {
    setBook(null);
    setPath([]);
  };

  const goToDepth = (depth: number) => setPath((current) => current.slice(0, depth));

  const currentLevelLabel = levels[path.length]?.label ?? '';

  return (
    <div className="page services-page">
      <motion.header
        className="services-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
      >
        <h1 className="services-title">Services</h1>
        <p className="services-subtitle">
          Browse the church books by their traditional order, down to the chants themselves.
        </p>
      </motion.header>

      {/* Breadcrumb */}
      <nav className="services-crumbs" aria-label="Directory breadcrumb">
        <button type="button" className="services-crumb" onClick={goToRoot} disabled={!book}>
          Services
        </button>
        {book && (
          <>
            <span className="services-crumb-sep" aria-hidden="true">
              /
            </span>
            <button
              type="button"
              className="services-crumb"
              onClick={() => setPath([])}
              disabled={path.length === 0}
            >
              {book}
            </button>
          </>
        )}
        {path.map((segment, index) => (
          <span key={`${segment}-${index}`} className="services-crumb-wrap">
            <span className="services-crumb-sep" aria-hidden="true">
              /
            </span>
            <button
              type="button"
              className="services-crumb"
              onClick={() => goToDepth(index + 1)}
              disabled={index === path.length - 1}
            >
              {segment}
            </button>
          </span>
        ))}
      </nav>

      {isLoading ? (
        <div className="services-panel">Loading the church books…</div>
      ) : loadError ? (
        <div className="services-panel">{loadError}</div>
      ) : (
        <AnimatePresence mode="wait">
          {/* Root: the church books */}
          {!book && (
            <motion.div
              key="books"
              className="services-books"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
            >
              {CHURCH_BOOKS.map((name, index) => (
                <motion.button
                  key={name}
                  type="button"
                  className="services-book"
                  onClick={() => openBook(name)}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT, delay: index * 0.06 }}
                >
                  <span className="services-book-icon">
                    <BookIcon />
                  </span>
                  <span className="services-book-body">
                    <span className="services-book-name">{name}</span>
                    <span className="services-book-desc">{BOOK_DESCRIPTIONS[name]}</span>
                  </span>
                  <span className="services-book-count">
                    {bookCounts[name] || 0} {bookCounts[name] === 1 ? 'chant' : 'chants'}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Folder level */}
          {book && !atLeaf && (
            <motion.div
              key={`folders-${path.join('/')}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              {currentLevelLabel && <p className="services-level-label">{currentLevelLabel}</p>}

              {folders.length === 0 ? (
                <div className="services-panel">
                  Nothing filed here yet. Set a chant's book to <strong>{book}</strong> in the chant
                  editor and it will appear in this directory.
                </div>
              ) : (
                <div className="services-folders">
                  {folders.map((folder, index) => (
                    <motion.button
                      key={folder.name}
                      type="button"
                      className="services-folder"
                      onClick={() => openFolder(folder.name)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: EASE_OUT, delay: index * 0.03 }}
                    >
                      <span className="services-folder-icon">
                        <FolderIcon />
                      </span>
                      <span className="services-folder-name">{folder.name}</span>
                      <span className="services-folder-count">{folder.count}</span>
                      <span className="services-folder-chevron">
                        <ChevronIcon />
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Leaf: composer sections, then the chants themselves */}
          {book && atLeaf && (
            <motion.div
              key={`leaf-${path.join('/')}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              {composerGroups.length === 0 ? (
                <div className="services-panel">No chants here yet.</div>
              ) : (
                composerGroups.map((group) => (
                  <section className="services-composer" key={group.composer}>
                    <header className="services-composer-header">
                      <h2 className="services-composer-name">{group.composer}</h2>
                      <span className="services-composer-count">
                        {group.chants.length} {group.chants.length === 1 ? 'chant' : 'chants'}
                      </span>
                    </header>
                    <div className="chants-grid">
                      {group.chants.map((chant, index) => (
                        <ChantCard
                          key={chant.id}
                          chant={chant}
                          onView={onViewChant}
                          onEdit={handleEditChant}
                          isSaved={savedChantIds.includes(chant.id)}
                          showSaveButton
                          onToggleBooklet={toggleBookletChant}
                          isInBooklet={bookletChantIds.includes(chant.id)}
                          index={index}
                        />
                      ))}
                    </div>
                  </section>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {bookletChantIds.length > 0 && (
          <motion.div
            className="services-booklet-bar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <span className="services-booklet-count">
              {bookletChantIds.length} {bookletChantIds.length === 1 ? 'chant' : 'chants'} selected
            </span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setBookletModalOpen(true)}
            >
              Open Booklet Builder
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setBookletChantIds([])}
            >
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <UploadChantModal
        open={uploadModalOpen}
        initialChant={editingChant}
        onClose={() => {
          setUploadModalOpen(false);
          setEditingChant(null);
        }}
        onSaved={handleSavedChant}
      />

      <BookletBuilderModal
        open={bookletModalOpen}
        onClose={() => setBookletModalOpen(false)}
        selectedChants={bookletChantIds
          .map((id) => chants.find((chant) => chant.id === id))
          .filter((chant): chant is Chant => !!chant)}
        onRemoveChant={(id) =>
          setBookletChantIds((current) => current.filter((chantId) => chantId !== id))
        }
        onClearSelection={() => setBookletChantIds([])}
        onNavigate={onNavigate}
        onRequestLogin={() => {
          setAuthMode('login');
          setAuthModalOpen(true);
        }}
      />

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSwitchMode={setAuthMode}
      />
    </div>
  );
};

export default ServicesPage;
