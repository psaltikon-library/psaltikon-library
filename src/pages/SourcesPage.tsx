import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

type SourceEntry = {
  title: string;
  url: string;
  section: string;
  service: string;
  notation: 'Byzantine' | 'Western';
  kind: 'piece' | 'collection';
  language?: string;
  audio?: string;
  pages?: number;
  /** The monastery's own catalogue number, e.g. b0140. */
  code?: string;
};

type SourceFile = {
  source: { name: string; homepage: string; note: string; indexedAt: string; count: number };
  entries: SourceEntry[];
};

const PAGE_SIZE = 60;
const ALL = 'All';

const SourcesPage = () => {
  const [data, setData] = useState<SourceFile | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [section, setSection] = useState(ALL);
  const [notation, setNotation] = useState(ALL);
  const [kind, setKind] = useState(ALL);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      try {
        // Relative to the document so it resolves under the GitHub Pages subpath.
        const response = await fetch(new URL('external-sources.json', document.baseURI));
        if (!response.ok) throw new Error(`Failed to load index (${response.status})`);
        const parsed = (await response.json()) as SourceFile;
        if (active) setData(parsed);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load the index.');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const sections = useMemo(() => {
    if (!data) return [ALL];
    return [ALL, ...Array.from(new Set(data.entries.map((e) => e.section))).sort()];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();

    return data.entries.filter((entry) => {
      if (section !== ALL && entry.section !== section) return false;
      if (notation !== ALL && entry.notation !== notation) return false;
      if (kind !== ALL && entry.kind !== kind) return false;
      if (!q) return true;
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.section.toLowerCase().includes(q) ||
        (entry.language || '').toLowerCase().includes(q)
      );
    });
  }, [data, query, section, notation, kind]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, section, notation, kind]);

  return (
    <div className="page">
      <motion.header
        className="sources-head"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>External Sources</h1>
        <p>
          A searchable index of Byzantine scores published elsewhere, so everything is findable in
          one place. Files open on the publisher's own site — nothing is re-hosted here.
        </p>
      </motion.header>

      {data && (
        <div className="sources-attribution">
          <div>
            <strong>{data.source.name}</strong>
            <p>{data.source.note}</p>
          </div>
          <a
            className="btn btn-secondary btn-sm"
            href={data.source.homepage}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit the project ↗
          </a>
        </div>
      )}

      {error && <div className="sources-error">{error}</div>}

      {isLoading ? (
        <p className="sources-note">Loading index…</p>
      ) : (
        data && (
          <>
            <div className="sources-controls">
              <input
                className="search-input sources-search"
                type="search"
                placeholder="Search by title, section, or language…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search external sources"
              />

              <select
                className="filter-select"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                aria-label="Filter by section"
              >
                {sections.map((value) => (
                  <option key={value} value={value}>
                    {value === ALL ? 'All sections' : value}
                  </option>
                ))}
              </select>

              <select
                className="filter-select"
                value={notation}
                onChange={(e) => setNotation(e.target.value)}
                aria-label="Filter by notation"
              >
                <option value={ALL}>Both notations</option>
                <option value="Byzantine">Byzantine</option>
                <option value="Western">Western</option>
              </select>

              <select
                className="filter-select"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                aria-label="Filter by kind"
              >
                <option value={ALL}>Pieces & collections</option>
                <option value="piece">Individual pieces</option>
                <option value="collection">Collections</option>
              </select>
            </div>

            <p className="sources-count">
              {filtered.length.toLocaleString()} of {data.entries.length.toLocaleString()} entries
            </p>

            {filtered.length === 0 ? (
              <p className="sources-note">No entries match those filters.</p>
            ) : (
              <>
                <ul className="sources-list">
                  {filtered.slice(0, visible).map((entry) => (
                    <li className="sources-row" key={entry.url}>
                      <div className="sources-row-main">
                        <a
                          className="sources-row-title"
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {entry.title}
                        </a>
                        <div className="sources-row-meta">
                          {entry.code && <span className="sources-code">{entry.code}</span>}
                          <span className="badge badge-outline">{entry.section}</span>
                          <span className={`badge ${entry.notation === 'Byzantine' ? 'badge-burgundy' : 'badge-blue'}`}>
                            {entry.notation}
                          </span>
                          {entry.kind === 'collection' && (
                            <span className="badge badge-gold">
                              Collection{entry.pages ? ` · ${entry.pages} pp` : ''}
                            </span>
                          )}
                          {entry.language && <span className="badge badge-purple">{entry.language}</span>}
                        </div>
                      </div>

                      <div className="sources-row-actions">
                        {entry.audio && (
                          <a
                            className="btn btn-ghost btn-sm"
                            href={entry.audio}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Listen
                          </a>
                        )}
                        <a
                          className="btn btn-secondary btn-sm"
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open PDF ↗
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>

                {visible < filtered.length && (
                  <div className="sources-more">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setVisible((current) => current + PAGE_SIZE)}
                    >
                      Show more ({(filtered.length - visible).toLocaleString()} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )
      )}
    </div>
  );
};

export default SourcesPage;
