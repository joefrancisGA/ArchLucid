import { cn } from "@/lib/utils";

const REVIEW_TRAIL_KINDS: ReadonlyArray<{ k: string; role: string; c: string }> = [
  {
    k: "Review steps",
    role: "Process milestones",
    c: "bg-teal-100 text-teal-950 dark:bg-teal-950/50 dark:text-teal-100",
  },
  {
    k: "Capture & analysis",
    role: "Feeds into risks",
    c: "bg-sky-100 text-sky-950 dark:bg-sky-950/50 dark:text-sky-100",
  },
  {
    k: "Primary finding",
    role: "Drives package decisions",
    c: "bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100",
  },
  {
    k: "Final record",
    role: "The governed decision",
    c: "bg-emerald-100 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100",
  },
  {
    k: "Deliverables",
    role: "Executive & audit outputs",
    c: "bg-violet-100 text-violet-950 dark:bg-violet-950/40 dark:text-violet-100",
  },
];

const REVIEW_TRAIL_KINDS_BUYER: ReadonlyArray<{ k: string; role: string; c: string }> = [
  {
    k: "Source evidence",
    role: "Captured context and citations",
    c: "bg-teal-100 text-teal-950 dark:bg-teal-950/50 dark:text-teal-100",
  },
  {
    k: "Analysis",
    role: "Interpretation and linkage",
    c: "bg-sky-100 text-sky-950 dark:bg-sky-950/50 dark:text-sky-100",
  },
  {
    k: "Finding",
    role: "Anchors manifest decisions",
    c: "bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100",
  },
  {
    k: "Decision",
    role: "Governed approval posture",
    c: "bg-emerald-100 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100",
  },
  {
    k: "Deliverable",
    role: "Briefings and audit bundles",
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
    <ul className={cn("m-0 flex flex-wrap gap-2 p-0 list-none", props.className)}>
      {rows.map((x) => (
        <li
          key={x.k}
          className={cn(
            "inline-flex items-baseline gap-1.5 rounded-full px-2.5 py-0.5",
            x.c,
          )}
          title={x.role}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide">{x.k}</span>
          {showRoles ? (
            <span className="text-[11px] font-normal normal-case tracking-normal opacity-75">
              — {x.role}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
