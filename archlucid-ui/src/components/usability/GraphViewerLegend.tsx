import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
/** Legend for evidence graph node types and default layout hints. */
export function GraphViewerLegend() {
  const rows = [
    { color: "bg-teal-500", label: "Review node" },
    { color: "bg-amber-500", label: "Finding" },
    { color: "bg-neutral-500", label: "Evidence / artifact" },
    { color: "bg-violet-500", label: "Agent step" },
  ];

  return (
    <div
      className={cn("mb-3 flex flex-wrap items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="graph-viewer-legend"
      role="note"
      aria-label="Graph legend"
    >
      <span className="font-semibold text-neutral-700 dark:text-neutral-300">Legend</span>
      {rows.map((row) => (
        <span key={row.label} className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
          <span className={row.color + " inline-block h-2.5 w-2.5 rounded-full"} aria-hidden />
          {row.label}
        </span>
      ))}
      <span className="text-neutral-500">
        <InlineGuidanceLabel label="Tip:" className="text-neutral-600 dark:text-neutral-400" /> Start in review-trail mode; use filters to reduce noise.
      </span>
    </div>
  );
}
