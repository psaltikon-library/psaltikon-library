interface OrthodoxCrossProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * The Orthodox three-bar cross as inline SVG so the logo renders identically on
 * every device — the ☦ emoji it replaces was drawn by each platform's own emoji
 * font (Apple/Android/etc.), so it looked different everywhere. Uses
 * currentColor, so it takes the colour of whatever it sits in.
 */
export default function OrthodoxCross({
  size = 24,
  strokeWidth = 2,
  className,
}: OrthodoxCrossProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* vertical post */}
      <line x1="12" y1="2.5" x2="12" y2="21.5" />
      {/* top bar (titulus) */}
      <line x1="8.5" y1="5.5" x2="15.5" y2="5.5" />
      {/* main cross-bar */}
      <line x1="5.5" y1="9" x2="18.5" y2="9" />
      {/* slanted footrest */}
      <line x1="8" y1="16.5" x2="16" y2="13.5" />
    </svg>
  );
}
