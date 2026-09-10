import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import ChantDetailPage from './pages/ChantDetailPage';
import PhoneticsPage from './pages/PhoneticsPage';
import BookletsPage from './pages/BookletsPage';
import ServicesPage from './pages/ServicesPage';
import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';
import SavedItemsPage from './pages/SavedItemsPage';
import SuggestionModal from './components/SuggestionModal';
import BookletBuilderModal from './components/BookletBuilderModal';
import AuthModal from './components/AuthModal';
import { Page, Chant } from './types';
import { recordChantView, recordPageView } from './utils/analytics';

const STORAGE_PAGE_KEY = 'psaltikon_current_page';
const STORAGE_CHANT_KEY = 'psaltikon_selected_chant';

const validPages: Page[] = [
  'home',
  'library',
  'chant-detail',
  'phonetics',
  'booklets',
  'services',
  'compositions',
  'about',
  'admin',
  'saved-items',
];

const isValidPage = (value: string | null): value is Page => {
  return value !== null && validPages.includes(value as Page);
};

const getRouteState = (): { page: Page; chantId: string | null } => {
  const params = new URLSearchParams(window.location.search);
  const urlPage = params.get('page');
  const urlChantId = params.get('chantId');

  if (isValidPage(urlPage)) {
    return {
      page: urlPage,
      chantId: urlPage === 'chant-detail' ? urlChantId : null,
    };
  }
  
  return { page: 'home', chantId: null };
};

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

function App() {
  const initialRoute = getRouteState();
  const [currentPage, setCurrentPage] = useState<Page>(initialRoute.page);
  const [selectedChantId, setSelectedChantId] = useState<string | null>(initialRoute.chantId);
  const [isScrolled, setIsScrolled] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);

  // Booklet selection lives here so it persists across pages and the navbar can
  // show a count while the builder bubble is minimized. Full Chant objects are
  // kept (not just ids) so the builder modal can render them from any page.
  const [bookletChants, setBookletChants] = useState<Chant[]>([]);
  const [bookletMinimized, setBookletMinimized] = useState(false);
  const [bookletModalOpen, setBookletModalOpen] = useState(false);
  const [bookletAuthOpen, setBookletAuthOpen] = useState(false);
  const [bookletAuthMode, setBookletAuthMode] = useState<'login' | 'signup'>('login');

  const bookletChantIds = bookletChants.map((chant) => chant.id);

  const toggleBookletChant = useCallback((chant: Chant) => {
    setBookletChants((current) =>
      current.some((existing) => existing.id === chant.id)
        ? current.filter((existing) => existing.id !== chant.id)
        : [...current, chant]
    );
  }, []);

  // Once the selection empties, the bubble/navbar icon disappear — reset the
  // minimized flag so the next booklet starts expanded.
  useEffect(() => {
    if (bookletChants.length === 0 && bookletMinimized) {
      setBookletMinimized(false);
    }
  }, [bookletChants.length, bookletMinimized]);

  // The static HTML loader (index.html) is only there for a slow boot; drop it
  // as soon as the app has mounted so the home page shows straight away.
  useEffect(() => {
    document.getElementById('app-loader')?.remove();
  }, []);

  const syncRoute = useCallback(
    (page: Page, chantId: string | null, mode: 'push' | 'replace' = 'push') => {
      const params = new URLSearchParams();
      params.set('page', page);

      if (page === 'chant-detail' && chantId) {
        params.set('chantId', chantId);
      }

      const nextUrl = `${window.location.pathname}?${params.toString()}`;

      if (mode === 'replace') {
        window.history.replaceState({ page, chantId }, '', nextUrl);
      } else {
        window.history.pushState({ page, chantId }, '', nextUrl);
      }

      localStorage.setItem(STORAGE_PAGE_KEY, page);

      if (page === 'chant-detail' && chantId) {
        localStorage.setItem(STORAGE_CHANT_KEY, chantId);
      } else {
        localStorage.removeItem(STORAGE_CHANT_KEY);
      }
    },
    []
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    syncRoute(currentPage, selectedChantId, 'replace');

    void recordPageView(currentPage, selectedChantId);

    const handlePopState = () => {
      const route = getRouteState();
      setCurrentPage(route.page);
      setSelectedChantId(route.chantId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPage, selectedChantId, syncRoute]);

  // Memoized so scroll-driven re-renders here don't hand every page a new
  // callback identity, which would re-run child effects that depend on it.
  const navigateToChant = useCallback(
    (chantId: string) => {
      setSelectedChantId(chantId);
      setCurrentPage('chant-detail');
      syncRoute('chant-detail', chantId);
      void recordChantView(chantId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [syncRoute]
  );

  const navigateTo = useCallback(
    (page: Page) => {
      const nextChantId = page === 'chant-detail' ? selectedChantId : null;
      setCurrentPage(page);

      if (page !== 'chant-detail') {
        setSelectedChantId(null);
      }

      syncRoute(page, nextChantId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [selectedChantId, syncRoute]
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            onNavigate={navigateTo}
            onViewChant={navigateToChant}
            bookletChantIds={bookletChantIds}
            onToggleBookletChant={toggleBookletChant}
          />
        );
      case 'library':
        return (
          <LibraryPage
            onViewChant={navigateToChant}
            onNavigate={navigateTo}
            bookletChantIds={bookletChantIds}
            onToggleBookletChant={toggleBookletChant}
          />
        );
      case 'chant-detail':
        return (
          <ChantDetailPage
            chantId={selectedChantId}
            onBack={() => navigateTo('library')}
            onNavigate={navigateTo}
          />
        );
      case 'phonetics':
        return (
          <PhoneticsPage
            onViewChant={navigateToChant}
          />
        );
      case 'booklets':
        return (
          <BookletsPage />
        );
      // 'compositions' is kept as an alias so links shared before the rename
      // still land on the directory.
      case 'services':
      case 'compositions':
        return (
          <ServicesPage
            onViewChant={navigateToChant}
            onNavigate={navigateTo}
          />
        );
      case 'about':
        return (
          <AboutPage />
        );

      case 'admin':
        return (
          <AdminPage
            onNavigate={navigateTo}
          />
        );
      case 'saved-items':
        return (
          <SavedItemsPage
            onViewChant={navigateToChant}
          />
        );
      default:
        return (
          <HomePage
            onNavigate={navigateTo}
            onViewChant={navigateToChant}
            bookletChantIds={bookletChantIds}
            onToggleBookletChant={toggleBookletChant}
          />
        );
    }
  };

  return (
    <>
      <motion.div
        className="app"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Header
          currentPage={currentPage}
          onNavigate={navigateTo}
          isScrolled={isScrolled}
          onOpenSuggestion={() => setSuggestionOpen(true)}
          bookletCount={bookletChants.length}
          bookletMinimized={bookletMinimized}
          onExpandBooklet={() => setBookletMinimized(false)}
        />

        <AnimatePresence mode="wait">
          <motion.main
            key={currentPage}
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            style={{ flex: 1 }}
          >
            {renderPage()}
          </motion.main>
        </AnimatePresence>

        <Footer onNavigate={navigateTo} />
      </motion.div>

      <SuggestionModal
        open={suggestionOpen}
        onClose={() => setSuggestionOpen(false)}
        onSubmitted={() => {
          setSuggestionOpen(false);
        }}
      />

      {/* Floating booklet-builder bubble, pinned near the top of the page and
          shared across pages. Minimizing tucks it into the navbar icon. */}
      <AnimatePresence>
        {bookletChants.length > 0 && !bookletMinimized && (
          <motion.div
            key="booklet-bubble"
            className="booklet-bubble booklet-bubble--card"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            role="region"
            aria-label="Booklet builder"
          >
            <span className="booklet-bubble-label">
              <span aria-hidden="true">📚</span> {bookletChants.length}{' '}
              {bookletChants.length === 1 ? 'chant' : 'chants'} selected
            </span>
            <div className="booklet-bubble-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setBookletChants([])}
              >
                Clear
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setBookletModalOpen(true)}
              >
                Open Builder
              </button>
              <button
                type="button"
                className="booklet-bubble-min"
                onClick={() => setBookletMinimized(true)}
                aria-label="Minimize booklet builder"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BookletBuilderModal
        open={bookletModalOpen}
        onClose={() => setBookletModalOpen(false)}
        selectedChants={bookletChants}
        onRemoveChant={(id) =>
          setBookletChants((current) => current.filter((chant) => chant.id !== id))
        }
        onClearSelection={() => setBookletChants([])}
        onNavigate={navigateTo}
        onRequestLogin={() => {
          setBookletAuthMode('login');
          setBookletAuthOpen(true);
        }}
      />

      {/* Rendered after the builder so it stacks above it; the builder picks up
          the new session itself via onAuthStateChange. */}
      <AuthModal
        open={bookletAuthOpen}
        mode={bookletAuthMode}
        onClose={() => setBookletAuthOpen(false)}
        onSwitchMode={setBookletAuthMode}
      />
    </>
  );
}

export default App;
