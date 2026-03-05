import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import ChantDetailPage from './pages/ChantDetailPage';
import PhoneticsPage from './pages/PhoneticsPage';
import CompositionsPage from './pages/CompositionsPage';
import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';
import { Page } from './types';

// Loading screen component
const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="loading-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "backOut" }}
      >
        <motion.div
          className="loading-cross"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          ☦
        </motion.div>
      </motion.div>
      <motion.p 
        className="loading-text"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        PSALTIKON LIBRARY
      </motion.p>
      <motion.div
        style={{
          width: 120,
          height: 2,
          background: 'var(--border)',
          borderRadius: 2,
          marginTop: 24,
          overflow: 'hidden'
        }}
      >
        <motion.div
          style={{
            width: '100%',
            height: '100%',
            background: 'var(--burgundy)',
            transformOrigin: 'left'
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
        />
      </motion.div>
    </motion.div>
  );
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
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedChantId, setSelectedChantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateToChant = (chantId: string) => {
    setSelectedChantId(chantId);
    setCurrentPage('chant-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage 
            onNavigate={navigateTo} 
            onViewChant={navigateToChant}
          />
        );
      case 'library':
        return (
          <LibraryPage 
            onViewChant={navigateToChant}
          />
        );
      case 'chant-detail':
        return (
          <ChantDetailPage 
            chantId={selectedChantId}
            onBack={() => navigateTo('library')}
          />
        );
      case 'phonetics':
        return (
          <PhoneticsPage 
            onViewChant={navigateToChant}
          />
        );
      case 'compositions':
        return (
          <CompositionsPage 
            onViewChant={navigateToChant}
          />
        );
      case 'about':
        return <AboutPage onNavigate={navigateTo} />;
      case 'admin':
        return (
          <AdminPage
            onNavigate={navigateTo}
          />
        );
      default:
        return <HomePage onNavigate={navigateTo} onViewChant={navigateToChant} />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingScreen key="loading" onComplete={() => setIsLoading(false)} />
      ) : (
        <motion.div 
          className="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Header 
            currentPage={currentPage} 
            onNavigate={navigateTo}
            isScrolled={isScrolled}
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
      )}
    </AnimatePresence>
  );
}

export default App;
