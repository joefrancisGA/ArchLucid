import { LIVE_DEMO_REVIEW_INTEGRITY_BODY, LIVE_DEMO_REVIEW_INTEGRITY_HEADING } from "@/lib/live-demo-page-copy";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const INTEGRITY_POINTS = [
  "Immutable sealed review record",
  "Evidence traceability to captured context",
  "Recorded governance approval",
  "Accountable actors on each milestone",
  "Retained audit history",
] as const;

export function LiveDemoReviewIntegritySection() {
  return (
    <section
      className="rounded-lg border border-teal-700/20 bg-teal-50/50 p-4 dark:border-teal-500/20 dark:bg-teal-950/20"
      data-testid="live-demo-review-integrity"
      aria-labelledby="live-demo-review-integrity-heading"
    >
      <h3
        id="live-demo-review-integrity-heading"
        className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.cardTitle)}
      >
        {LIVE_DEMO_REVIEW_INTEGRITY_HEADING}
      </h3>
      <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
        {LIVE_DEMO_REVIEW_INTEGRITY_BODY}
      </p>
      <ul className="m-0 mt-3 list-disc space-y-1 pl-5">
        {INTEGRITY_POINTS.map((point) => (
          <li key={point} className={cn("text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}
