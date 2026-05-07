import { cn } from "@/lib/utils";

const REVIEW_TRAIL_KINDS: ReadonlyArray<{ k: string; c: string }> = [
  { k: "Review steps", c: "bg-teal-100 text-teal-950 dark:bg-teal-950/50 dark:text-teal-100" },
  { k: "Capture & analysis", c: "bg-sky-100 text-sky-950 dark:bg-sky-950/50 dark:text-sky-100" },
  { k: "Flagship risk", c: "bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100" },
  { k: "Final record", c: "bg-emerald-100 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100" },
  { k: "Deliverables", c: "bg-violet-100 text-violet-950 dark:bg-violet-950/40 dark:text-violet-100" },
];

/** Legend tuned for coordinator provenance / review-trail graphs (not architecture entity types). */
export function GraphReviewTrailLegendChips(props: { className?: string }) {
  return (
    <ul className={cn("m-0 flex flex-wrap gap-2 p-0 list-none", props.className)}>
      {REVIEW_TRAIL_KINDS.map((x) => (
        <li
          key={x.k}
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${x.c}`}
        >
          {x.k}
        </li>
      ))}
    </ul>
  );
}
