import { goalTone } from "@/lib/calendar/colors";

// Stacked, softly-tinted "folder" glyph used wherever a goal needs a
// visual identity beyond a flat color dot — reuses only the app's
// existing --chart-N tokens (via currentColor) rather than new hues.
export function GlassFolder({
  goalId,
  size = 32,
  className,
}: {
  goalId: string;
  size?: number;
  className?: string;
}) {
  const tone = goalTone(goalId);
  const gradId = `glass-folder-grad-${goalId}`;
  const noiseId = `glass-folder-noise-${goalId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={`${tone.text} ${className ?? ""}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.45" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.08" />
        </linearGradient>
        <filter id={noiseId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.05" />
          </feComponentTransfer>
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
      </defs>

      {/* Depth: two neutral outlines stacked behind the front folder */}
      <rect
        x="9" y="9" width="32" height="24" rx="5"
        fill="none" stroke="currentColor" strokeOpacity="0.15"
      />
      <rect
        x="7" y="11" width="34" height="25" rx="5"
        fill="none" stroke="currentColor" strokeOpacity="0.22"
      />

      {/* Front folder: tab + body, tinted with the goal's tone */}
      <rect x="4" y="12" width="17" height="9" rx="3.5" fill={`url(#${gradId})`} />
      <rect x="4" y="16" width="40" height="26" rx="6" fill={`url(#${gradId})`} />
      <rect x="4" y="16" width="40" height="26" rx="6" fill="currentColor" filter={`url(#${noiseId})`} />
      <rect
        x="4" y="16" width="40" height="26" rx="6"
        fill="none" stroke="currentColor" strokeOpacity="0.3"
      />
    </svg>
  );
}
