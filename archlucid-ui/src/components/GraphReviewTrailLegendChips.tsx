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
    k: "Flagship risk",
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
    role: "Sponsor & audit outputs",
    c: "bg-violet-100 text-violet-950 dark:bg-violet-950/40 dark:text-violet-100",
  },
];

/** Legend tuned for coordinator provenance / review-trail graphs (not architecture entity types). */
export function GraphReviewTrailLegendChips(props: { className?: string; showRoles?: boolean }) {
  const showRoles = props.showRoles ?? true;

  return (
    <ul className={cn("m-0 flex flex-wrap gap-2 p-0 list-none", props.className)}>
      {REVIEW_TRAIL_KINDS.map((x) => (
        <li
          key={x.k}
          className={cn(
            "inline-flex items-baseline gap-1.5 rounded-full px-2.5 py-0.5",
            x.c,
          )}
          title={x.role}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide">{x.k}</span>
          {showRoles ? (
            <span className="text-[10px] font-normal normal-case tracking-normal opacity-75">
              — {x.role}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
