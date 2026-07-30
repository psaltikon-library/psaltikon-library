import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Booklet, Chant } from '../types';
import { createBooklet, updateBooklet } from '../utils/booklets';

interface BookletEditorModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  booklet?: Booklet | null;
  chants: Chant[];
  onClose: () => void;
  onSaved: (bookletId: string) => void;
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const PlusIcon = () => (
  <svg {...iconProps}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const XIcon = () => (
  <svg {...iconProps}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const UpIcon = () => (
  <svg {...iconProps}>
    <path d="m18 15-6-6-6 6" />
  </svg>
);
const DownIcon = () => (
  <svg {...iconProps}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export default function BookletEditorModal({
  open,
  mode,
  booklet,
  chants,
  onClose,
  onSaved,
}: BookletEditorModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Pool of every chant we might reference (library + any already on the booklet).
  const chantMap = useMemo(() => {
    const map = new Map<string, Chant>();
    chants.forEach((c) => map.set(c.id, c));
    booklet?.chants?.forEach((c) => {
      if (!map.has(c.id)) map.set(c.id, c);
    });
    return map;
  }, [chants, booklet]);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && booklet) {
      setTitle(booklet.title);
      setDescription(booklet.description || '');
      setIsPublic(booklet.is_public);
      setSelectedIds((booklet.chants || []).map((c) => c.id));
    } else {
      setTitle('');
      setDescription('');
      setIsPublic(false);
      setSelectedIds([]);
    }
    setSearch('');
    setError('');
    setIsSaving(false);
  }, [open, mode, booklet]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const selectedChants = selectedIds
    .map((id) => chantMap.get(id))
    .filter((c): c is Chant => Boolean(c));

  const availableChants = useMemo(() => {
    const q = search.trim().toLowerCase();
    return chants
      .filter((c) => !selectedIds.includes(c.id))
      .filter((c) => {
        if (!q) return true;
        return [c.title, c.titleGreek, c.tone, c.feast, c.service, c.language]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q));
      })
      .slice(0, 40);
  }, [chants, selectedIds, search]);

  const addChant = (id: string) => setSelectedIds((ids) => [...ids, id]);
  const removeChant = (id: string) => setSelectedIds((ids) => ids.filter((x) => x !== id));
  const move = (index: number, delta: number) => {
    setSelectedIds((ids) => {
      const next = [...ids];
      const target = index + delta;
      if (target < 0 || target >= next.length) return ids;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please give your booklet a title.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const input = {
        title,
        description,
        isPublic,
        chantIds: selectedIds,
      };
      const id =
        mode === 'edit' && booklet
          ? (await updateBooklet(booklet.id, input), booklet.id)
          : await createBooklet(input);
      onSaved(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save booklet.');
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="booklet-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={mode === 'edit' ? 'Edit booklet' : 'Create booklet'}
        >
          <button className="booklet-modal-backdrop" onClick={onClose} aria-label="Close" />

          <motion.div
            className="booklet-modal"
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 14, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <div className="booklet-modal-header">
              <div>
                <p className="booklet-modal-eyebrow">{mode === 'edit' ? 'Edit booklet' : 'New booklet'}</p>
                <h2 className="booklet-modal-title">Compile a booklet</h2>
              </div>
              <button className="booklet-modal-close" onClick={onClose} aria-label="Close">
                <XIcon />
              </button>
            </div>

            <div className="booklet-modal-body">
              <div className="booklet-form">
                <label className="booklet-field">
                  <span className="booklet-label">Title</span>
                  <input
                    className="booklet-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Nativity Vigil"
                    maxLength={120}
                  />
                </label>

                <label className="booklet-field">
                  <span className="booklet-label">Description (optional)</span>
                  <textarea
                    className="booklet-input booklet-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A short note about this collection"
                    rows={2}
                    maxLength={280}
                  />
                </label>

                <div className="booklet-visibility">
                  <div>
                    <span className="booklet-label">{isPublic ? 'Public' : 'Private'}</span>
                    <p className="booklet-visibility-hint">
                      {isPublic
                        ? 'Anyone can find and download this booklet.'
                        : 'Only you can see this booklet.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`toggle-switch ${isPublic ? 'active' : ''}`}
                    role="switch"
                    aria-checked={isPublic}
                    aria-label="Public booklet"
                    onClick={() => setIsPublic((v) => !v)}
                  />
                </div>
              </div>

              <div className="booklet-picker">
                <div className="booklet-selected">
                  <p className="booklet-label">
                    In this booklet <span className="booklet-count-chip">{selectedChants.length}</span>
                  </p>
                  {selectedChants.length === 0 ? (
                    <p className="booklet-empty-hint">No chants yet — add some from the list.</p>
                  ) : (
                    <ol className="booklet-selected-list">
                      {selectedChants.map((chant, index) => (
                        <li key={chant.id} className="booklet-selected-item">
                          <span className="booklet-selected-index">{index + 1}</span>
                          <span className="booklet-selected-info">
                            <span className="booklet-selected-title">{chant.title}</span>
                            <span className="booklet-selected-meta">
                              {[chant.tone, chant.language].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          <span className="booklet-selected-actions">
                            <button
                              type="button"
                              onClick={() => move(index, -1)}
                              disabled={index === 0}
                              aria-label="Move up"
                            >
                              <UpIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() => move(index, 1)}
                              disabled={index === selectedChants.length - 1}
                              aria-label="Move down"
                            >
                              <DownIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeChant(chant.id)}
                              aria-label="Remove"
                            >
                              <XIcon />
                            </button>
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                <div className="booklet-available">
                  <input
                    className="booklet-input booklet-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search chants to add…"
                  />
                  <div className="booklet-available-list">
                    {availableChants.length === 0 ? (
                      <p className="booklet-empty-hint">No matching chants.</p>
                    ) : (
                      availableChants.map((chant) => (
                        <button
                          key={chant.id}
                          type="button"
                          className="booklet-available-item"
                          onClick={() => addChant(chant.id)}
                        >
                          <span className="booklet-available-info">
                            <span className="booklet-available-title">{chant.title}</span>
                            <span className="booklet-available-meta">
                              {[chant.tone, chant.feast, chant.language].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          <span className="booklet-available-add" aria-hidden="true">
                            <PlusIcon />
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="booklet-modal-error">{error}</div>}

            <div className="booklet-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create booklet'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
