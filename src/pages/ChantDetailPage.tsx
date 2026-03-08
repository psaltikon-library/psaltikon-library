import { motion } from 'framer-motion';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Chant } from '../types';
import { Document, Page, pdfjs } from 'react-pdf';
import { supabase } from '../lib/supabase';

import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// IMPORTANT: configure the PDF.js worker for Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();


function guessFileNameFromUrl(url: string): string {
  try {
    const u = new URL(url, window.location.href);
    const last = u.pathname.split('/').filter(Boolean).pop() || 'document.pdf';
    return last.toLowerCase().endsWith('.pdf') ? last : `${last}.pdf`;
  } catch {
    const last = url.split('/').filter(Boolean).pop() || 'document.pdf';
    return last.toLowerCase().endsWith('.pdf') ? last : `${last}.pdf`;
  }
}

async function downloadUrlAsFile(url: string, filename: string) {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.rel = 'noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();

  // give the browser a moment before revoking
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

export async function downloadPdf(file: string | File, downloadName?: string) {
  // Case 1: user uploaded a File
  if (file instanceof File) {
    const blobUrl = URL.createObjectURL(file);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = file.name || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    return;
  }

  // Case 2: file is a URL (local public/ file or remote)
  const filename = downloadName || guessFileNameFromUrl(file);
  await downloadUrlAsFile(file, filename);
}

function PdfToolbar({
  page,
  numPages,
  canPrev,
  canNext,
  scale,
  minScale,
  maxScale,
  downloading,
  onPrev,
  onNext,
  onZoomOut,
  onZoomIn,
  onDownload,
  openUrl,
  variant,
}: {
  page: number;
  numPages: number;
  canPrev: boolean;
  canNext: boolean;
  scale: number;
  minScale: number;
  maxScale: number;
  downloading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onDownload: () => void;
  openUrl?: string;
  variant?: 'card' | 'header';
}) {
  const isHeader = variant === 'header';
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };
  return (
    <div className={isHeader ? 'pdf-toolbar pdf-toolbar--header' : 'pdf-toolbar'}>
      <div className="pdf-toolbar-left">
        <button type="button" onClick={stop(onPrev)} disabled={!canPrev}>
          Prev
        </button>
        <span>
          Page <b>{page}</b> / <b>{numPages || '—'}</b>
        </span>
        <button type="button" onClick={stop(onNext)} disabled={!canNext}>
          Next
        </button>
      </div>
      <div className="pdf-toolbar-right">
        <button type="button" onClick={stop(onZoomOut)} disabled={scale <= minScale}>
          –
        </button>
        <span style={{ minWidth: 70, textAlign: 'center' }}>
          <b>{Math.round(scale * 100)}%</b>
        </span>
        <button type="button" onClick={stop(onZoomIn)} disabled={scale >= maxScale}>
          +
        </button>
        <button type="button" className="pdf-toolbar-download" onClick={stop(onDownload)} disabled={downloading}>
          {downloading ? 'Downloading…' : 'Download'}
        </button>
        {openUrl ? (
          <a href={openUrl} target="_blank" rel="noreferrer">
            Open
          </a>
        ) : null}
      </div>
    </div>
  );
}

function PdfErrorBanner({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="pdf-error-banner">
      <b>PDF Error:</b> {error}
    </div>
  );
}

type PdfDocumentRendererHandle = {
  scrollToPage: (page: number) => void;
};

const PdfDocumentRenderer = forwardRef(function PdfDocumentRenderer(
  {
    file,
    fileKey,
    page,
    scale,
    onLoaded,
    onError,
    onVisiblePageChange,
  }: {
    file: string | File;
    fileKey: string;
    page: number;
    scale: number;
    onLoaded: (numPages: number) => void;
    onError: (message: string) => void;
    onVisiblePageChange: (page: number) => void;
  },
  ref: React.ForwardedRef<PdfDocumentRendererHandle>
) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [wrapWidth, setWrapWidth] = useState<number>(0);
  const [numPages, setNumPages] = useState<number>(0);

  const pageWrapRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (!wrapRef.current) return;

    const el = wrapRef.current;

    const setNow = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w > 0) setWrapWidth(w);
    };

    // IMPORTANT: set initial width immediately
    setNow();

    const ro = new ResizeObserver(() => setNow());
    ro.observe(el);

    window.addEventListener('resize', setNow);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', setNow);
    };
  }, []);

  // account for the 12px left/right padding in .pdf-doc-page-wrap
  const availableWidth = Math.max(0, wrapWidth - 24);
  // Always provide a concrete width so react-pdf updates reliably.
  const baseWidth = availableWidth > 0 ? availableWidth : 900;
  const pageWidth = Math.floor(baseWidth * scale);

  function internalScrollToPage(target: number) {
    const t = Math.max(1, Math.min(numPages || 1, target));
    const el = pageWrapRefs.current[t - 1];
    const root = scrollRef.current;
    if (!el) return;

    // Scroll only inside the PDF container (root), not the whole window.
    if (root) {
      const rootRect = root.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const top = elRect.top - rootRect.top + root.scrollTop;

      root.scrollTo({ top: Math.max(0, top - 8), behavior: 'smooth' });
      return;
    }

    // If there is no scroll root, do nothing (avoid scrolling the whole page)
    return;
  }

  useImperativeHandle(ref, () => ({
    scrollToPage: internalScrollToPage,
  }));

  // Track the most visible page while scrolling
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    if (!numPages) return;

    const els = pageWrapRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;

    let raf = 0;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (!visible?.target) return;

        const p = Number((visible.target as HTMLElement).dataset.pageNumber || 1);

        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => onVisiblePageChange(p));
      },
      { root, threshold: [0.25, 0.5, 0.75] }
    );

    els.forEach((el) => io.observe(el));

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [numPages, onVisiblePageChange]);

  // When page changes via toolbar, scroll to it
  useEffect(() => {
    if (!numPages) return;
    internalScrollToPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, numPages]);

  return (
    <div className="pdf-doc" ref={scrollRef}>
      <Document
        key={fileKey}
        file={file}
        onLoadSuccess={({ numPages: loaded }) => {
          setNumPages(loaded);
          onLoaded(loaded);
        }}
        onLoadError={(e) => onError((e as any)?.message ?? 'Failed to load PDF')}
        loading={<div style={{ padding: 16 }}>Loading PDF…</div>}
        error={<div style={{ padding: 16 }}>Could not display PDF.</div>}
        noData={<div style={{ padding: 16 }}>No PDF selected.</div>}
      >
        <div className="pdf-doc-page-wrap" ref={wrapRef}>
          <div className="pdf-doc-scroll">
            {Array.from({ length: numPages || 0 }, (_, i) => {
              const p = i + 1;
              return (
                <div
                  key={`${p}-${pageWidth}`}
                  className="pdf-doc-page"
                  data-page-number={p}
                  ref={(el) => {
                    pageWrapRefs.current[i] = el;
                  }}
                >
                  <Page
                    key={`${p}-${pageWidth}`}
                    pageNumber={p}
                    width={pageWidth}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    loading={<div style={{ padding: 16 }}>Rendering page…</div>}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </Document>
    </div>
  );
});

interface ChantDetailPageProps {
  chantId: string | null;
  onBack: () => void;
}

const ChantDetailPage = ({ chantId, onBack }: ChantDetailPageProps) => {
  const [chant, setChant] = useState<Chant | null>(null);
  const [isLoadingChant, setIsLoadingChant] = useState(true);
  const [chantError, setChantError] = useState('');

  useEffect(() => {
    const loadChant = async () => {
      if (!chantId) {
        setChant(null);
        setChantError('No chant was selected.');
        setIsLoadingChant(false);
        return;
      }

      setIsLoadingChant(true);
      setChantError('');

      const { data, error } = await supabase
        .from('chants')
        .select('*')
        .eq('id', chantId)
        .maybeSingle();

      if (error) {
        setChant(null);
        setChantError(error.message || 'Failed to load chant.');
        setIsLoadingChant(false);
        return;
      }

      if (!data) {
        setChant(null);
        setChantError('The requested chant could not be found.');
        setIsLoadingChant(false);
        return;
      }

      setChant(data as Chant);
      setIsLoadingChant(false);
    };

    void loadChant();
  }, [chantId]);

  const handleComingSoon = (action: string) => {
    alert(`${action} feature coming soon! This will be available in a future update.`);
  };

  if (isLoadingChant) {
    return (
      <div className="detail-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', padding: '4rem' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }}>⏳</div>
          <h2>Loading chant...</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Pulling chant details from the library database.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!chant) {
    return (
      <div className="detail-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', padding: '4rem' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }}>📜</div>
          <h2>Chant not found</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {chantError || 'The requested chant could not be found.'}
          </p>
          <motion.button
            className="btn btn-primary"
            style={{ marginTop: '2rem' }}
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back to Library
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const chantTitle = chant.title;

  const pdfPath = useMemo(() => {
    const anyChant = chant as any;
    if (!anyChant) return '';

    const direct =
      anyChant.pdfUrl ||
      anyChant.pdfURL ||
      anyChant.pdfPath ||
      anyChant.pdf_path ||
      anyChant.pdf ||
      anyChant.pdfFile ||
      anyChant.pdf_file ||
      anyChant.fileUrl ||
      anyChant.fileURL ||
      anyChant.filePath ||
      anyChant.scorePdf ||
      anyChant.scorePDF ||
      anyChant.sheetPdf ||
      anyChant.sheetPDF ||
      anyChant.musicPdf ||
      anyChant.musicPDF;

    const nested =
      anyChant.assets?.pdf ||
      anyChant.assets?.pdfUrl ||
      anyChant.assets?.pdfURL ||
      anyChant.files?.pdf ||
      anyChant.files?.pdfUrl ||
      anyChant.files?.pdfURL ||
      anyChant.document?.pdf ||
      anyChant.document?.pdfUrl ||
      anyChant.document?.pdfURL ||
      anyChant.file?.pdf ||
      anyChant.file?.url ||
      anyChant.file?.path;

    const fromArray = Array.isArray(anyChant.files)
      ? (anyChant.files.find((f: any) => {
          const url = f?.url || f?.path || f?.href;
          const name = f?.name || f?.filename;
          return (
            (typeof url === 'string' && url.toLowerCase().includes('.pdf')) ||
            (typeof name === 'string' && name.toLowerCase().endsWith('.pdf'))
          );
        })?.url ||
          anyChant.files.find((f: any) => {
            const url = f?.url || f?.path || f?.href;
            const name = f?.name || f?.filename;
            return (
              (typeof url === 'string' && url.toLowerCase().includes('.pdf')) ||
              (typeof name === 'string' && name.toLowerCase().endsWith('.pdf'))
            );
          })?.path ||
          anyChant.files.find((f: any) => {
            const url = f?.url || f?.path || f?.href;
            const name = f?.name || f?.filename;
            return (
              (typeof url === 'string' && url.toLowerCase().includes('.pdf')) ||
              (typeof name === 'string' && name.toLowerCase().endsWith('.pdf'))
            );
          })?.href)
      : undefined;

    const candidate = direct || nested || fromArray || '';
    return typeof candidate === 'string' ? candidate.trim() : '';
  }, [chant]);

  const [pdfSource, setPdfSource] = useState('');

  useEffect(() => {
    let isActive = true;

    const resolvePdfSource = async () => {
      if (!pdfPath) {
        if (isActive) setPdfSource('');
        return;
      }

      if (
        /^https?:\/\//i.test(pdfPath) ||
        pdfPath.startsWith('blob:') ||
        pdfPath.startsWith('data:')
      ) {
        if (isActive) setPdfSource(pdfPath);
        return;
      }

      if (pdfPath.startsWith('/')) {
        if (isActive) {
          setPdfSource(`${import.meta.env.BASE_URL}${pdfPath.replace(/^\//, '')}`);
        }
        return;
      }

      if (pdfPath.toLowerCase().includes('.pdf')) {
        const { data } = supabase.storage.from('chant-pdfs').getPublicUrl(pdfPath);
        if (isActive) {
          setPdfSource(data?.publicUrl || '');
        }
        return;
      }

      if (isActive) setPdfSource('');
    };

    void resolvePdfSource();

    return () => {
      isActive = false;
    };
  }, [pdfPath]);

  const hasPdf = !!pdfSource;

  // PDF viewer state (so toolbar can live in the viewer header)
  const [pdfNumPages, setPdfNumPages] = useState<number>(0);
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState<number>(1.0);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const pdfFileKey = useMemo(() => {
    return pdfSource || 'no-pdf';
  }, [pdfSource]);

  const pdfRendererRef = useRef<PdfDocumentRendererHandle | null>(null);
  const pdfNavLockRef = useRef(false);

  function goToPdfPage(target: number) {
    const t = Math.max(1, Math.min(pdfNumPages || 1, target));
    pdfNavLockRef.current = true;
    setPdfPage(t);
    pdfRendererRef.current?.scrollToPage(t);

    // release the lock shortly after the programmatic scroll begins
    window.setTimeout(() => {
      pdfNavLockRef.current = false;
    }, 350);
  }


  const pdfCanPrev = pdfPage > 1;
  const pdfCanNext = pdfNumPages > 0 && pdfPage < pdfNumPages;

  async function handlePdfToolbarDownload() {
    if (!hasPdf) return;
    try {
      setPdfDownloading(true);
      setPdfError(null);
      await downloadPdf(pdfSource, `${chantTitle}.pdf`);
    } catch (e: any) {
      setPdfError(e?.message ?? 'Failed to download PDF');
    } finally {
      setPdfDownloading(false);
    }
  }

  function handlePdfLoaded(loadedPages: number) {
    setPdfNumPages(loadedPages);
    setPdfPage(1);
    setPdfError(null);
  }

  function handlePdfDocError(message: string) {
    setPdfError(message);
  }

  const handleDownloadPdf = async () => {
    if (!hasPdf) {
      alert('No PDF is linked to this chant yet.');
      return;
    }
    try {
      setPdfDownloading(true);
      setPdfError(null);
      await downloadPdf(pdfSource, `${chantTitle}.pdf`);
    } catch (e: any) {
      alert(e?.message ?? 'Failed to download PDF');
      setPdfError(e?.message ?? 'Failed to download PDF');
    } finally {
      setPdfDownloading(false);
    }
  };

  return (
    <div className="detail-page">
      {/* Breadcrumb */}
      <motion.div
        className="detail-breadcrumb"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.a
          onClick={onBack}
          style={{ cursor: 'pointer' }}
          whileHover={{ color: 'var(--burgundy)' }}
        >
          Library
        </motion.a>
        <span>/</span>
        <span>{chant.part}</span>
        <span>/</span>
        <span style={{ color: 'var(--text-primary)' }}>{chant.title}</span>
      </motion.div>

      {/* Header */}
      <motion.div
        className="detail-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.h1
          className="detail-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {chant.title}
        </motion.h1>

        {chant.titleGreek && (
          <motion.p
            style={{
              fontFamily: 'var(--font-accent)',
              fontSize: '1.5rem',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              marginBottom: '1.5rem',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {chant.titleGreek}
          </motion.p>
        )}

        <motion.div
          className="detail-meta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.span
            className="badge badge-burgundy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.5 }}
          >
            {chant.tone}
          </motion.span>
          <motion.span
            className="badge badge-gold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.55 }}
          >
            {chant.service}
          </motion.span>
          <motion.span
            className="badge badge-purple"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.6 }}
          >
            {chant.part}
          </motion.span>
          <motion.span
            className="badge badge-blue"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.65 }}
          >
            {chant.language}
          </motion.span>
          <motion.span
            className="badge badge-outline"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.7 }}
          >
            {chant.feast}
          </motion.span>
        </motion.div>

        <motion.div
          className="detail-actions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {/* Download button #1 (header) */}
          <motion.button
            className="btn btn-primary"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => void handleDownloadPdf()}
            disabled={!hasPdf}
          >
            Download PDF
          </motion.button>

          <motion.button
            className="btn btn-secondary"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleComingSoon('Add to Booklet')}
          >
            + Add to Booklet
            <span className="coming-soon-badge">Soon</span>
          </motion.button>

          <motion.button
            className="btn btn-ghost"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
          >
            ← Back
          </motion.button>
        </motion.div>
      </motion.div>

      {/* PDF Viewer */}
      <motion.div
        className="pdf-viewer"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="pdf-viewer-header pdf-viewer-header--with-toolbar">
          <span className="pdf-viewer-title">📄 {chantTitle}.pdf</span>
          {hasPdf ? (
            <div className="pdf-viewer-header-toolbar-wrap">
              <PdfToolbar
                page={pdfPage}
                numPages={pdfNumPages}
                canPrev={pdfCanPrev}
                canNext={pdfCanNext}
                scale={pdfScale}
                minScale={0.5}
                maxScale={2.5}
                downloading={pdfDownloading}
                onPrev={() => goToPdfPage(pdfPage - 1)}
                onNext={() => goToPdfPage(pdfPage + 1)}
                onZoomOut={() => setPdfScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)))}
                onZoomIn={() => setPdfScale((s) => Math.min(2.5, +(s + 0.1).toFixed(2)))}
                onDownload={handlePdfToolbarDownload}
                openUrl={pdfSource}
                variant="header"
              />
            </div>
          ) : null}
        </div>

        {/* Viewer inside pdf-viewer-content */}
        <div className="pdf-viewer-content pdf-viewer-content--padded">
          {hasPdf ? (
            <>
              <PdfErrorBanner error={pdfError} />
              <PdfDocumentRenderer
                ref={pdfRendererRef}
                file={pdfSource}
                fileKey={pdfFileKey}
                page={pdfPage}
                scale={pdfScale}
                onLoaded={handlePdfLoaded}
                onError={handlePdfDocError}
                onVisiblePageChange={(p) => {
                  if (pdfNavLockRef.current) return;
                  setPdfPage(p);
                }}
              />
            </>
          ) : (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              No PDF is linked to this chant yet.
            </div>
          )}
        </div>
      </motion.div>

      {/* Phonetics Section (if available) */}
      {chant.hasPhonetics && chant.phoneticsText && (
        <motion.div
          style={{ marginTop: '2rem' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 style={{ marginBottom: '1rem' }}>Phonetic Transliteration</h3>
          <div className="transliteration-text">{chant.phoneticsText}</div>
        </motion.div>
      )}

      {/* Related Chants */}
      <motion.div
        style={{ marginTop: '4rem' }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <h3 style={{ marginBottom: '1.5rem' }}>Related Chants</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1rem',
          }}
        >
          {[]
            .filter((c: Chant) => c.id !== chant.id && (c.service === chant.service || c.tone === chant.tone))
            .slice(0, 3)
            .map((relatedChant: Chant, index: number) => (
              <motion.div
                key={relatedChant.id}
                style={{
                  padding: '1rem',
                  background: 'var(--bg-surface)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{
                  y: -4,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                }}
              >
                <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{relatedChant.title}</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-burgundy" style={{ fontSize: '0.7rem' }}>
                    {relatedChant.tone}
                  </span>
                  <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                    {relatedChant.service}
                  </span>
                </div>
              </motion.div>
            ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ChantDetailPage;
