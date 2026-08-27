import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  DEFAULT_FILTER_OPTIONS,
  FilterCategory,
  loadFilterValues,
} from '../utils/filterOptions';
import { createChantSubmission } from '../utils/chantSubmissions';
import { loadComposers } from '../utils/composers';

interface SuggestionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

const withCurrent = (values: string[], current: string) =>
  current && !values.includes(current) ? [current, ...values] : values;

export default function SuggestionModal({ open, onClose, onSubmitted }: SuggestionModalProps) {
  const [title, setTitle] = useState('');
  const [feast, setFeast] = useState('');
  const [service, setService] = useState('');
  const [part, setPart] = useState('');
  const [tone, setTone] = useState('');
  const [language, setLanguage] = useState('');
  const [composer, setComposer] = useState('');
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filterValues, setFilterValues] =
    useState<Record<FilterCategory, string[]>>(DEFAULT_FILTER_OPTIONS);
  const [composers, setComposers] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalPdfCount = pdfFiles.length;

  const resetForm = () => {
    setTitle('');
    setFeast('');
    setService('');
    setPart('');
    setTone('');
    setLanguage('');
    setComposer('');
    setPdfFiles([]);
    setIsSubmitting(false);
    setError('');
    setIsDragOver(false);
  };

  const applyPdfFiles = (files: FileList | File[] | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    const pdfs = incoming.filter((file) => file.type === 'application/pdf');

    if (pdfs.length < incoming.length) {
      alert('Only PDF files can be added. Non-PDF files were skipped.');
    }
    if (!pdfs.length) return;

    setPdfFiles((current) => {
      const seen = new Set(current.map((file) => `${file.name}:${file.size}`));
      const additions = pdfs.filter((file) => !seen.has(`${file.name}:${file.size}`));
      return [...current, ...additions];
    });
  };

  const removePendingFile = (index: number) => {
    setPdfFiles((current) => current.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    applyPdfFiles(e.dataTransfer.files);
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let isActive = true;
    void loadFilterValues().then((values) => {
      if (isActive) setFilterValues(values);
    });
    return () => {
      isActive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let isActive = true;
    void loadComposers().then((list) => {
      if (isActive) setComposers(list);
    });
    return () => {
      isActive = false;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter a chant title.');
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError('You must be logged in to submit a chant.');
      return;
    }

    if (totalPdfCount === 0) {
      setError('Please add at least one PDF.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createChantSubmission(
        { title: trimmedTitle, tone, feast, service, part, language, composer },
        pdfFiles
      );
      onSubmitted?.();
      resetForm();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit chant.');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="auth-modal-overlay auth-modal-overlay--signup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="auth-modal-backdrop"
            onClick={onClose}
            aria-label="Close suggestion modal"
          />

          <motion.div
            className="auth-modal auth-modal--signup"
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 14, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <div className="auth-modal-header">
              <div className="auth-modal-brand">
                <div className="auth-modal-icon">💡</div>
                <div>
                  <div className="auth-modal-app">Psaltikon Library</div>
                  <div className="auth-modal-title">Suggest a Chant</div>
                  <div className="auth-modal-subtitle">
                    Submit a chant with its PDF. An admin will review it before it joins the library.
                  </div>
                </div>
              </div>

              <button type="button" onClick={onClose} className="auth-modal-close" aria-label="Close">
                ✕
              </button>
            </div>

            <form className="auth-modal-body upload-chant-form" onSubmit={handleSubmit}>
              <div className="auth-field upload-chant-form__title">
                <label className="auth-label">Chant Title *</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Enter chant title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="upload-chant-form__content">
                <div className="upload-chant-form__fields">
                  <div className="auth-field">
                    <label className="auth-label">Part of Service</label>
                    <select className="auth-input" value={part} onChange={(e) => setPart(e.target.value)}>
                      <option value="">None</option>
                      {withCurrent(filterValues.part, part).map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Tone (Echos)</label>
                    <select className="auth-input" value={tone} onChange={(e) => setTone(e.target.value)}>
                      <option value="">None</option>
                      {withCurrent(filterValues.tone, tone).map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Service</label>
                    <select className="auth-input" value={service} onChange={(e) => setService(e.target.value)}>
                      <option value="">None</option>
                      {withCurrent(filterValues.service, service).map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Feast</label>
                    <select className="auth-input" value={feast} onChange={(e) => setFeast(e.target.value)}>
                      <option value="">None</option>
                      {withCurrent(filterValues.feast, feast).map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div className="auth-field upload-chant-form__field--full">
                    <label className="auth-label">Language</label>
                    <select className="auth-input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                      <option value="">None</option>
                      {withCurrent(filterValues.language, language).map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div className="auth-field upload-chant-form__field--full">
                    <label className="auth-label">Composer</label>
                    <input
                      className="auth-input"
                      type="text"
                      list="suggest-composer-options"
                      placeholder="Type a composer name"
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                    />
                    <datalist id="suggest-composer-options">
                      {composers.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="upload-chant-form__upload-field">
                  <div className="auth-field">
                    <label className="auth-label">Upload PDFs *</label>

                    {pdfFiles.length > 0 && (
                      <div className="chant-pdf-list">
                        {pdfFiles.map((file, index) => (
                          <div className="chant-pdf-item is-new" key={`${file.name}-${file.size}-${index}`}>
                            <span className="chant-pdf-item__name">
                              {file.name}
                              <span className="chant-pdf-item__tag">New</span>
                            </span>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => removePendingFile(index)}
                              aria-label={`Remove ${file.name}`}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      className={`upload-dropzone${isDragOver ? ' is-dragover' : ''}${totalPdfCount > 0 ? ' has-file' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        className="upload-dropzone__input"
                        type="file"
                        accept="application/pdf"
                        multiple
                        onChange={(e) => {
                          applyPdfFiles(e.target.files);
                          e.target.value = '';
                        }}
                      />

                      <div className="upload-dropzone__icon">⇪</div>
                      <div className="upload-dropzone__title">
                        {totalPdfCount > 0
                          ? `${totalPdfCount} PDF${totalPdfCount === 1 ? '' : 's'} attached — add more`
                          : 'Drag & drop PDFs here'}
                      </div>
                      <div className="upload-dropzone__subtitle">
                        You can select several files at once. The first PDF is used as the chant's
                        primary score.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ color: 'var(--burgundy)', fontSize: '0.92rem' }}>{error}</div>
              )}

              <button type="submit" className="auth-submit upload-chant-form__submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
