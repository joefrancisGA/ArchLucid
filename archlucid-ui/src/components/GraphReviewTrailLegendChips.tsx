import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const REVIEW_TRAIL_KINDS: ReadonlyArray<{ k: string; role: string; swatch: string; c: string }> = [
  {
    k: "Review steps",
    role: "Process milestones",
    swatch: "bg-teal-600",
    c: "bg-teal-100 text-teal-950 dark:bg-teal-950/50 dark:text-teal-100",
  },
  {
    k: "Capture & analysis",
    role: "Feeds into risks",
    swatch: "bg-sky-500",
    c: "bg-sky-100 text-sky-950 dark:bg-sky-950/50 dark:text-sky-100",
  },
  {
    k: "Primary finding",
    role: "Drives package decisions",
    swatch: "bg-amber-500",
    c: "bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100",
  },
  {
    k: "Final record",
    role: "The governed decision",
    swatch: "bg-emerald-600",
    c: "bg-emerald-100 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100",
  },
  {
    k: "Deliverables",
    role: "Executive & audit outputs",
    swatch: "bg-violet-500",
    c: "bg-violet-100 text-violet-950 dark:bg-violet-950/40 dark:text-violet-100",
  },
];

const REVIEW_TRAIL_KINDS_BUYER: ReadonlyArray<{ k: string; role: string; swatch: string; c: string }> = [
  {
    k: "Source evidence",
    role: "Captured context and citations",
    swatch: "bg-teal-600",
    c: "bg-teal-100 text-teal-950 dark:bg-teal-950/50 dark:text-teal-100",
  },
  {
    k: "Analysis",
    role: "Interpretation and linkage",
    swatch: "bg-sky-500",
    c: "bg-sky-100 text-sky-950 dark:bg-sky-950/50 dark:text-sky-100",
  },
  {
    k: "Finding",
    role: "Anchors review decisions",
    swatch: "bg-amber-500",
    c: "bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100",
  },
  {
    k: "Decision",
    role: "Governed approval posture",
    swatch: "bg-emerald-600",
    c: "bg-emerald-100 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100",
  },
  {
    k: "Deliverable",
    role: "Briefings and audit bundles",
    swatch: "bg-violet-500",
    c: "bg-violet-100 text-violet-950 dark:bg-violet-950/40 dark:text-violet-100",
  },
];

/** Legend tuned for coordinator provenance / review-trail graphs (not architecture entity types). */
export function GraphReviewTrailLegendChips(props: {
  readonly className?: string;
  readonly showRoles?: boolean;
  readonly buyerPolished?: boolean;
}) {
  const showRoles = props.showRoles ?? true;
  const rows = props.buyerPolished === true ? REVIEW_TRAIL_KINDS_BUYER : REVIEW_TRAIL_KINDS;

  return (
    <ul className={cn("m-0 flex flex-wrap gap-2 p-0 list-none", props.className)} data-testid="graph-review-trail-legend">
      {rows.map((x) => (
        <li
          key={x.k}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
            x.c,
          )}
          title={x.role}
        >
          <span
            className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-sm border border-black/10", x.swatch)}
            aria-hidden
          />
          <span className={cn("font-semibold uppercase tracking-wide", OPERATOR_TYPOGRAPHY.helper)}>{x.k}</span>
          {showRoles ? (
            <span className={cn("font-normal normal-case tracking-normal opacity-75", OPERATOR_TYPOGRAPHY.helper)}>
              — {x.role}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
