import { cn } from "@/lib/utils";
import { OPERATOR_NAV_GROUP_LABEL } from "@/lib/design-tokens";

const KINDS: ReadonlyArray<{ k: string; swatch: string; c: string }> = [
  {
    k: "Decision",
    swatch: "bg-blue-500",
    c: "bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200",
  },
  {
    k: "Finding",
    swatch: "bg-amber-500",
    c: "bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100",
  },
  {
    k: "Artifact",
    swatch: "bg-violet-500",
    c: "bg-violet-100 text-violet-950 dark:bg-violet-950/40 dark:text-violet-100",
  },
  {
    k: "Review",
    swatch: "bg-teal-600",
    c: "bg-teal-100 text-teal-950 dark:bg-teal-950/40 dark:text-teal-100",
  },
  {
    k: "Component",
    swatch: "bg-neutral-500",
    c: "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
  },
];

/**
 * Compact legend chips for graph node categories — shown in idle state and when the interactive graph is visible.
 * TB-2098: this is the sole loaded-graph legend vocabulary (node types the canvas draws).
 */
export function GraphNodeKindLegendChips(props: {
  className?: string;
  /** Accessible name; defaults to Legend for the single canvas legend contract (TB-2098). */
  "aria-label"?: string;
}) {
  return (
    <ul
      className={cn("m-0 flex flex-wrap gap-2 p-0 list-none", props.className)}
      data-testid="graph-node-kind-legend"
      aria-label={props["aria-label"] ?? "Legend"}
    >
      {KINDS.map((x) => (
        <li
          key={x.k}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold uppercase tracking-wide",
            x.c,
            OPERATOR_NAV_GROUP_LABEL,
          )}
        >
          <span
            className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-sm border border-black/10", x.swatch)}
            aria-hidden
          />
          {x.k}
        </li>
      ))}
    </ul>
  );
}
