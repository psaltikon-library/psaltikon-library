import { motion } from 'framer-motion';
import { Booklet } from '../types';

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const icons = {
  download: (
    <svg {...iconProps}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  ),
  edit: (
    <svg {...iconProps}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  trash: (
    <svg {...iconProps}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  lock: (
    <svg {...iconProps} width={13} height={13}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  globe: (
    <svg {...iconProps} width={13} height={13}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20" />
    </svg>
  ),
  pages: (
    <svg {...iconProps} width={14} height={14}>
      <path d="M4 4h9l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M13 4v5h5" />
    </svg>
  ),
};

interface BookletCardProps {
  booklet: Booklet;
  variant: 'mine' | 'popular';
  downloading?: boolean;
  onDownload: (booklet: Booklet) => void;
  onEdit?: (booklet: Booklet) => void;
  onDelete?: (booklet: Booklet) => void;
  onToggleVisibility?: (booklet: Booklet) => void;
  index?: number;
}

export default function BookletCard({
  booklet,
  variant,
  downloading,
  onDownload,
  onEdit,
  onDelete,
  onToggleVisibility,
  index = 0,
}: BookletCardProps) {
  const count = booklet.chantCount ?? booklet.chants?.length ?? 0;

  return (
    <motion.article
      className="booklet-card"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
    >
      <div className="booklet-card-top">
        <span className="booklet-card-spine" aria-hidden="true">
          {icons.pages}
        </span>
        {variant === 'mine' ? (
          <button
            type="button"
            className={`booklet-visibility-badge ${booklet.is_public ? 'is-public' : 'is-private'}`}
            onClick={() => onToggleVisibility?.(booklet)}
            title="Toggle public / private"
          >
            {booklet.is_public ? icons.globe : icons.lock}
            {booklet.is_public ? 'Public' : 'Private'}
          </button>
        ) : (
          <span className="booklet-card-author">by {booklet.author_name || 'Anonymous'}</span>
        )}
      </div>

      <h3 className="booklet-card-title">{booklet.title}</h3>
      {booklet.description && <p className="booklet-card-description">{booklet.description}</p>}

      <div className="booklet-card-meta">
        <span>
          {count} {count === 1 ? 'chant' : 'chants'}
        </span>
        {variant === 'popular' && (
          <span>
            {booklet.download_count} {booklet.download_count === 1 ? 'download' : 'downloads'}
          </span>
        )}
      </div>

      <div className="booklet-card-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onDownload(booklet)}
          disabled={downloading || count === 0}
        >
          {icons.download}
          {downloading ? 'Building…' : 'Download PDF'}
        </button>

        {variant === 'mine' && (
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm booklet-icon-btn"
              onClick={() => onEdit?.(booklet)}
              aria-label="Edit booklet"
              title="Edit"
            >
              {icons.edit}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm booklet-icon-btn booklet-icon-btn--danger"
              onClick={() => onDelete?.(booklet)}
              aria-label="Delete booklet"
              title="Delete"
            >
              {icons.trash}
            </button>
          </>
        )}
      </div>
    </motion.article>
  );
}
