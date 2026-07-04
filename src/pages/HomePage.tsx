import { motion, MotionConfig, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Page, Chant } from '../types';
import ChantCard from '../components/ChantCard';
import toneWheelImg from '../assets/tone-wheel.jpg';
import { supabase } from '../lib/supabase';
import { resolveChantsWithDevFallback } from '../utils/chantFallback';
import { getSavedChantIds } from '../utils/savedChants';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  onViewChant: (id: string) => void;
}

const iconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const icons = {
  scroll: (
    <svg {...iconProps}>
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
      <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
    </svg>
  ),
  globe: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  ),
  bookOpen: (
    <svg {...iconProps}>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  ),
  search: (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  languages: (
    <svg {...iconProps}>
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  ),
  music: (
    <svg {...iconProps}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  library: (
    <svg {...iconProps}>
      <path d="m16 6 4 14" />
      <path d="M12 6v14" />
      <path d="M8 8v12" />
      <path d="M4 4v16" />
    </svg>
  ),
  arrowRight: (
    <svg {...iconProps} width={18} height={18}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  ),
  chevronDown: (
    <svg {...iconProps}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
};

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const HomePage = ({ onNavigate, onViewChant }: HomePageProps) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Scroll-linked hero choreography: the wheel drifts up, grows, and dims as the reader descends.
  const wheelY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%']);
  const wheelScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const wheelOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);

  const [featuredChants, setFeaturedChants] = useState<Chant[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [savedChantIds, setSavedChantIds] = useState<string[]>([]);

  const features = [
    {
      icon: icons.scroll,
      title: 'Byzantine Notation',
      description:
        'Authentic Byzantine musical notation preserved in high-resolution PDF, faithful to the manuscripts and ready for the analogion.',
      className: 'bento-a',
      featured: true,
    },
    {
      icon: icons.globe,
      title: 'Phonetic Support',
      description: 'Arabic chant with transliteration, so non-Arabic readers can sing along.',
      className: 'bento-b',
      featured: false,
    },
    {
      icon: icons.search,
      title: 'Advanced Search',
      description: 'Find chant by feast, service, tone, or moment in the office.',
      className: 'bento-c',
      featured: false,
    },
    {
      icon: icons.bookOpen,
      title: 'Custom Booklets',
      description:
        'Gather selections into a single service booklet and export one clean PDF — built for choir directors and readers.',
      className: 'bento-d',
      featured: false,
    },
  ];

  const heroStats = [
    { value: '500+', label: 'Chants' },
    { value: '8', label: 'Tones' },
    { value: '12', label: 'Feasts' },
  ];

  const collections = [
    {
      icon: icons.languages,
      title: 'Phonetics',
      subtitle: 'Antiochian tradition',
      description:
        'Arabic chant set with phonetic transliteration, opening the rich Antiochian repertoire to non-Arabic speakers.',
      page: 'phonetics' as Page,
    },
    {
      icon: icons.music,
      title: 'Compositions',
      subtitle: 'Beyond the feasts',
      description:
        'General compositions not tied to a single feast — doxologies, troparia, and other liturgical pieces.',
      page: 'compositions' as Page,
    },
    {
      icon: icons.library,
      title: 'Custom Booklets',
      subtitle: 'Coming soon',
      description:
        'Assemble personalized service booklets by selecting chant and generating a combined PDF.',
      page: null as Page | null,
    },
  ];

  const cardKeyDown = (action: () => void) => (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  useEffect(() => {
    const loadFeaturedChants = async () => {
      setIsLoadingFeatured(true);

      const { data, error } = await supabase
        .from('chants')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        setFeaturedChants(resolveChantsWithDevFallback(null).slice(0, 3));
        setIsLoadingFeatured(false);
        return;
      }

      setFeaturedChants(resolveChantsWithDevFallback(data as Chant[] | null).slice(0, 3));
      setIsLoadingFeatured(false);
    };

    void loadFeaturedChants();
  }, []);

  useEffect(() => {
    const loadSavedChantIds = async () => {
      setSavedChantIds(await getSavedChantIds());
    };

    void loadSavedChantIds();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {/* ── Hero ── */}
      <section className="hero" ref={heroRef}>
        {/* Knocks the scanned wheel's white paper to transparent so the cream hero shows through */}
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
          <filter id="hero-wheel-ink" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.176  0 0 0 0 0.149  0 0 0 0 0.129  -0.299 -0.587 -0.114 0 1"
            />
          </filter>
        </svg>

        <div className="hero-aura" aria-hidden="true" />

        <motion.div
          className="hero-wheel-layer"
          style={{ y: wheelY, scale: wheelScale, opacity: wheelOpacity }}
          aria-hidden="true"
        >
          <motion.div
            className="hero-wheel-spin"
            animate={prefersReduced ? undefined : { rotate: 360 }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 160 }}
          >
            <img className="hero-wheel" src={toneWheelImg} alt="" aria-hidden="true" />
          </motion.div>
        </motion.div>

        <div className="hero-grain" aria-hidden="true" />

        <motion.div className="hero-content" style={{ opacity: contentOpacity, y: contentY }}>
          <motion.p
            className="hero-badge"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 }}
          >
            <span className="hero-badge-mark">✦</span>
            A Sacred Treasury of Byzantine Chant
          </motion.p>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.2 }}
          >
            <span className="hero-title-main">Psaltikon</span>
            <span className="hero-title-accent">Library</span>
          </motion.h1>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.35 }}
          >
            Preserving and sharing the sacred tradition of Orthodox Byzantine chant
            for the glory of God and the edification of the faithful.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.5 }}
          >
            <button className="btn btn-primary btn-lg btn-nested" onClick={() => onNavigate('library')}>
              Browse Library
              <span className="btn-nested-icon">{icons.arrowRight}</span>
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => onNavigate('about')}>
              Our Mission
            </button>
          </motion.div>

          <motion.div
            className="hero-stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.65 }}
          >
            {heroStats.map((stat) => (
              <div className="hero-stat" key={stat.label}>
                <span className="hero-stat-value">{stat.value}</span>
                <span className="hero-stat-label">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-scroll-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          aria-hidden="true"
        >
          {icons.chevronDown}
        </motion.div>
      </section>

      {/* ── Opening verse ── */}
      <section className="section section-quote">
        <div className="container container-narrow">
          <motion.figure
            className="verse"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
          >
            <span className="verse-mark">☦</span>
            <blockquote className="verse-text">He who sings prays twice.</blockquote>
            <figcaption className="verse-source">St. Augustine of Hippo</figcaption>
          </motion.figure>
        </div>
      </section>

      {/* ── Resources (bento) ── */}
      <section className="section">
        <div className="container">
          <motion.header
            className="section-lead"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          >
            <h2>Sacred Resources</h2>
            <p>Everything the faithful need to enter the liturgical life of the Church.</p>
          </motion.header>

          <div className="bento">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                className={`bento-tile ${feature.className} ${feature.featured ? 'bento-tile-featured' : ''}`}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: EASE_OUT, delay: index * 0.08 }}
              >
                <span className="bento-icon">{feature.icon}</span>
                <h3 className="bento-title">{feature.title}</h3>
                <p className="bento-description">{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured chants ── */}
      <section className="section section-alt">
        <div className="container">
          <motion.header
            className="section-lead"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          >
            <h2>Featured Chants</h2>
            <p>Recent additions from the collection.</p>
          </motion.header>

          {isLoadingFeatured ? (
            <div className="chants-grid" aria-busy="true" aria-label="Loading featured chants">
              {[0, 1, 2].map((index) => (
                <div className="chant-card-skeleton" key={index}>
                  <div className="skeleton skeleton-icon" />
                  <div className="skeleton skeleton-line skeleton-line-title" />
                  <div className="skeleton skeleton-line skeleton-line-sub" />
                  <div className="skeleton-badges">
                    <span className="skeleton skeleton-badge" />
                    <span className="skeleton skeleton-badge" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredChants.length > 0 ? (
            <div className="chants-grid">
              {featuredChants.map((chant, index) => (
                <ChantCard
                  key={chant.id}
                  chant={chant}
                  onView={onViewChant}
                  isSaved={savedChantIds.includes(chant.id)}
                  showSaveButton={true}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">{icons.music}</div>
              <p className="empty-state-text">No chants available yet.</p>
            </div>
          )}

          <div className="section-cta">
            <button className="btn btn-primary btn-lg btn-nested" onClick={() => onNavigate('library')}>
              View All Chants
              <span className="btn-nested-icon">{icons.arrowRight}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Collections (zig-zag) ── */}
      <section className="section">
        <div className="container">
          <motion.header
            className="section-lead"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          >
            <h2>Explore Our Collections</h2>
            <p>A carefully ordered treasury of sacred music.</p>
          </motion.header>

          <div className="collections">
            {collections.map((collection, index) => {
              const interactive = collection.page !== null;
              const go = () => collection.page && onNavigate(collection.page);
              return (
                <motion.article
                  key={collection.title}
                  className={`collection-item ${interactive ? 'collection-item-clickable' : ''}`}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, ease: EASE_OUT, delay: index * 0.08 }}
                  onClick={interactive ? go : undefined}
                  onKeyDown={interactive ? cardKeyDown(go) : undefined}
                  role={interactive ? 'button' : undefined}
                  tabIndex={interactive ? 0 : undefined}
                >
                  <div className="collection-figure">
                    <span className="collection-icon">{collection.icon}</span>
                    <span className="collection-index">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="collection-body">
                    <p className="collection-subtitle">{collection.subtitle}</p>
                    <h3 className="collection-title">{collection.title}</h3>
                    <p className="collection-description">{collection.description}</p>
                    <span className={`collection-cta ${interactive ? '' : 'collection-cta-muted'}`}>
                      {interactive ? 'Explore' : 'Coming soon'}
                      {interactive && icons.arrowRight}
                    </span>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Closing verse ── */}
      <section className="section section-alt section-quote">
        <div className="container container-narrow">
          <div className="byzantine-divider">
            <div className="byzantine-divider-line" />
            <span className="byzantine-divider-icon">☦</span>
            <div className="byzantine-divider-line" />
          </div>
          <motion.figure
            className="verse"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
          >
            <blockquote className="verse-text">
              Sing to the Lord a new song; sing to the Lord, all the earth.
            </blockquote>
            <figcaption className="verse-source">Psalm 96:1</figcaption>
          </motion.figure>
        </div>
      </section>
    </MotionConfig>
  );
};

export default HomePage;
