import { motion, MotionConfig } from 'framer-motion';
import { FormEvent, useEffect, useState } from 'react';
import { Page, Chant } from '../types';
import { supabase } from '../lib/supabase';
import { resolveChantsWithDevFallback } from '../utils/chantFallback';
import { excludePrivateChants } from '../utils/chantVisibility';
import { TONE_COLORS, TONE_NAMES, toneColor, toneNumber } from '../utils/tones';
import { neumeForTone } from '../utils/toneNeumes';
import { BOOK_DESCRIPTIONS, CHURCH_BOOKS } from '../utils/churchBooks';
import { setLibraryPreset } from '../utils/libraryPreset';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  onViewChant: (id: string) => void;
  bookletChantIds: string[];
  onToggleBookletChant: (chant: Chant) => void;
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

interface LibraryFacts {
  chants: number;
  tones: number;
  feasts: number;
  byTone: number[]; // index 0 = Tone 1
  byBook: Record<string, number>;
}

const count = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

const HomePage = ({ onNavigate, onViewChant, bookletChantIds, onToggleBookletChant }: HomePageProps) => {
  const [featuredChants, setFeaturedChants] = useState<Chant[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [facts, setFacts] = useState<LibraryFacts | null>(null);
  const [query, setQuery] = useState('');

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

      setFeaturedChants(excludePrivateChants(resolveChantsWithDevFallback(data as Chant[] | null)).slice(0, 3));
      setIsLoadingFeatured(false);
    };

    void loadFeaturedChants();
  }, []);

  // Every number on the page comes from the library itself, so it stays true as it grows.
  useEffect(() => {
    const loadFacts = async () => {
      const { data, error } = await supabase.from('chants').select('id, title, tone, feast, book, status');
      if (error || !data) return;

      const approved = excludePrivateChants(data as Chant[]);
      if (approved.length === 0) return;

      const byTone = Array<number>(8).fill(0);
      const byBook: Record<string, number> = {};
      const feasts = new Set<string>();

      for (const chant of approved) {
        const tone = toneNumber(chant.tone);
        if (tone) byTone[tone - 1] += 1;
        if (chant.book) byBook[chant.book] = (byBook[chant.book] || 0) + 1;
        const feast = (chant.feast || '').trim().toLowerCase();
        if (feast) feasts.add(feast);
      }

      setFacts({
        chants: approved.length,
        tones: byTone.filter(Boolean).length,
        feasts: feasts.size,
        byTone,
        byBook,
      });
    };

    void loadFacts();
  }, []);

  const openLibrary = (preset?: { query?: string; tone?: string }) => {
    if (preset) setLibraryPreset(preset);
    onNavigate('library');
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    openLibrary(trimmed ? { query: trimmed } : undefined);
  };

  return (
    <MotionConfig reducedMotion="user">
      {/* ── Title page ── */}
      <section className="home-hero">
        <div className="home-hero__inner">
          <motion.div
            className="home-hero__copy"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            <h1 className="home-hero__title">
              Orthodox Byzantine chant, free for every chanter, choir and parish.
            </h1>

            <div className="home-hero__row">
            <form className="home-search" role="search" onSubmit={handleSearch}>
              <label className="home-search__label" htmlFor="home-search-input">
                Search the library
              </label>
              <input
                id="home-search-input"
                className="home-search__input"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title"
                autoComplete="off"
              />
              <button className="home-search__submit" type="submit">
                Search
              </button>
            </form>

            <p className="home-hero__aside">
              {facts ? (
                <>
                  {count(facts.chants, 'chant', 'chants')} in {count(facts.tones, 'tone', 'tones')} and{' '}
                  {count(facts.feasts, 'feast', 'feasts')}.{' '}
                </>
              ) : null}
              <button className="home-link" type="button" onClick={() => openLibrary()}>
                Browse everything
              </button>
            </p>
            </div>
          </motion.div>
        </div>
        <p className="home-hero__credit">Anoixantaria, melody by Prot. Mitri El-Murr</p>
      </section>

      {/* ── The eight tones ── */}
      <section className="home-tones" aria-labelledby="home-tones-title">
        <div className="home-wrap">
          <div className="home-head">
            <h2 className="home-h2" id="home-tones-title">
              Browse by tone
            </h2>
            <p className="home-head__note">
              Chant is sung in one of eight tones. Each keeps its colour on the cards and in the PDF headers.
            </p>
          </div>

          <ol className="home-tones__row">
            {TONE_COLORS.map((color, index) => {
              const number = index + 1;
              const total = facts?.byTone[index] ?? null;
              const neume = neumeForTone(`Tone ${number}`);
              const empty = total === 0;
              const inner = (
                <>
                  <span
                    className="home-tone__neume"
                    aria-hidden="true"
                    style={{
                      backgroundColor: color,
                      WebkitMaskImage: neume ? `url(${neume})` : undefined,
                      maskImage: neume ? `url(${neume})` : undefined,
                    }}
                  />
                  <span className="home-tone__name">Tone {number}</span>
                  <span className="home-tone__greek">{TONE_NAMES[index]}</span>
                  <span className="home-tone__count">
                    {total === null ? ' ' : empty ? 'None yet' : count(total, 'chant', 'chants')}
                  </span>
                </>
              );

              return (
                <li className="home-tone" key={number} style={{ ['--tone' as string]: color }}>
                  {empty ? (
                    <div className="home-tone__body home-tone__body--empty">{inner}</div>
                  ) : (
                    <button
                      className="home-tone__body"
                      type="button"
                      onClick={() => openLibrary({ tone: `Tone ${number}` })}
                      aria-label={`Tone ${number}, ${TONE_NAMES[index]}${total ? `, ${count(total, 'chant', 'chants')}` : ''}`}
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ── Church books ── */}
      <section className="home-books" aria-labelledby="home-books-title">
        <div className="home-wrap home-split">
          <div className="home-split__lead">
            <h2 className="home-h2" id="home-books-title">
              By church book
            </h2>
            <p className="home-prose">
              The Services directory files each chant where a chanter would look for it, in the book it is sung from.
            </p>
            <button className="home-link" type="button" onClick={() => onNavigate('services')}>
              Open the Services directory
            </button>
          </div>

          <ul className="home-toc">
            {CHURCH_BOOKS.map((book) => {
              const total = facts?.byBook[book];
              return (
                <li key={book}>
                  <button className="home-toc__row" type="button" onClick={() => onNavigate('services')}>
                    <span className="home-toc__title">{book}</span>
                    <span className="home-toc__leader" aria-hidden="true" />
                    <span className="home-toc__count">{total ? count(total, 'chant', 'chants') : ' '}</span>
                    <span className="home-toc__desc">{BOOK_DESCRIPTIONS[book]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── At the stand ── */}
      <section className="home-stand" aria-labelledby="home-stand-title">
        <div className="home-wrap">
          <blockquote className="home-statement">
            Byzantine chant is not merely music. It is prayer set to melody, theology sung aloud, and a living
            connection to centuries of Orthodox worship.
          </blockquote>

          <div className="home-split home-split--prose">
            <h2 className="home-h2 home-h2--small" id="home-stand-title">
              At the chanter&rsquo;s stand
            </h2>

            <div className="home-prose home-prose--long">
              <p>
                <span className="home-runin">Notation.</span> Every chant is a high-resolution PDF of the Byzantine
                notation. Opening or downloading one stamps its book, psalm, feast and chant type across the top, and
                the source credit along the bottom.
              </p>
              <p>
                <span className="home-runin">Phonetics.</span> Arabic and Greek chants carry phonetic transliteration,
                so a chanter who does not read the script can still follow.
              </p>
              <p>
                <span className="home-runin">Booklets.</span> Add chants as you browse and compile one PDF for the
                service. Keep the booklet private, or share it with other chanters.{' '}
                <button className="home-link" type="button" onClick={() => onNavigate('booklets')}>
                  Build a booklet
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Recent chants ── */}
      <section className="home-recent" aria-labelledby="home-recent-title">
        <div className="home-wrap">
          <div className="home-head home-head--row">
            <h2 className="home-h2" id="home-recent-title">
              Recent additions
            </h2>
            <button className="home-link" type="button" onClick={() => openLibrary()}>
              View all chants
            </button>
          </div>

          {isLoadingFeatured ? (
            <ul className="home-entries" aria-busy="true" aria-label="Loading recent additions">
              {[0, 1, 2].map((index) => (
                <li className="home-entry home-entry--ghost" key={index}>
                  <span className="skeleton home-entry__ghost" />
                </li>
              ))}
            </ul>
          ) : featuredChants.length > 0 ? (
            <ul className="home-entries">
              {featuredChants.map((chant) => {
                const neume = neumeForTone(chant.tone);
                const inBooklet = bookletChantIds.includes(chant.id);
                const meta = [chant.tone, chant.part, chant.service].filter(Boolean).join(' \u00b7 ');

                return (
                  <li className="home-entry" key={chant.id}>
                    <button className="home-entry__main" type="button" onClick={() => onViewChant(chant.id)}>
                      <span
                        className="home-entry__neume"
                        aria-hidden="true"
                        style={{
                          backgroundColor: toneColor(chant.tone) || 'var(--text-muted)',
                          WebkitMaskImage: neume ? `url(${neume})` : undefined,
                          maskImage: neume ? `url(${neume})` : undefined,
                        }}
                      />
                      <span className="home-entry__text">
                        <span className="home-entry__title">{chant.title}</span>
                        <span className="home-entry__meta">{meta}</span>
                      </span>
                    </button>
                    <button
                      className="home-link home-entry__booklet"
                      type="button"
                      aria-pressed={inBooklet}
                      onClick={() => onToggleBookletChant(chant)}
                    >
                      {inBooklet ? 'In your booklet' : 'Add to booklet'}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="home-prose">No chants available yet.</p>
          )}
        </div>
      </section>
    </MotionConfig>
  );
};

export default HomePage;
