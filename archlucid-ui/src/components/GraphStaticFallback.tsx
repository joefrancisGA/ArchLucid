/**
 * Non-interactive placeholder shown while the React Flow chunk loads or initializes.
 * Gives screenshot and demo paths a credible “evidence trail” silhouette instead of an empty box.
 */
export function GraphStaticFallback() {
  return (
    <div
      className="flex min-h-[320px] w-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-teal-300/80 bg-gradient-to-b from-teal-50/90 to-white px-4 py-6 dark:border-teal-800/60 dark:from-teal-950/35 dark:to-neutral-950/80"
      data-testid="graph-static-fallback"
      role="img"
      aria-label="Sample evidence trail preview: context, primary finding, decisions, and sealed package"
    >
      <svg
        viewBox="0 0 440 200"
        className="h-32 w-full max-w-md text-teal-800/90 dark:text-teal-200/90"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="graphFallbackEdge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <line
          x1="48"
          y1="100"
          x2="392"
          y2="100"
          stroke="url(#graphFallbackEdge)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <g fill="currentColor">
          <rect x="20" y="72" width="56" height="56" rx="10" opacity="0.9" />
          <rect x="120" y="72" width="56" height="56" rx="10" opacity="0.85" />
          <rect x="220" y="64" width="72" height="72" rx="12" opacity="1" />
          <rect x="336" y="72" width="56" height="56" rx="10" opacity="0.85" />
          <rect x="396" y="72" width="40" height="56" rx="10" opacity="0.75" />
        </g>
        <text
          x="48"
          y="152"
          textAnchor="middle"
          className="fill-neutral-600 text-[11px] font-medium dark:fill-neutral-300"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Context
        </text>
        <text
          x="148"
          y="152"
          textAnchor="middle"
          className="fill-neutral-600 text-[11px] font-medium dark:fill-neutral-300"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Evidence
        </text>
        <text
          x="256"
          y="156"
          textAnchor="middle"
          className="fill-neutral-800 text-[11px] font-semibold dark:fill-neutral-100"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Finding
        </text>
        <text
          x="364"
          y="152"
          textAnchor="middle"
          className="fill-neutral-600 text-[11px] font-medium dark:fill-neutral-300"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Decisions
        </text>
        <text
          x="416"
          y="152"
          textAnchor="middle"
          className="fill-neutral-600 text-[11px] font-medium dark:fill-neutral-300"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          Package
        </text>
      </svg>
      <p className="m-0 max-w-md text-center text-sm leading-snug text-neutral-600 dark:text-neutral-400">
        Sample evidence trail — the interactive graph appears here when the viewer finishes loading.
      </p>
    </div>
  );
}
