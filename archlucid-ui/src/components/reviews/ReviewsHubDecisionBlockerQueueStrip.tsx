import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEWS_HUB_DECISION_BLOCKER_QUEUE_HEADING,
  REVIEWS_HUB_DECISION_BLOCKER_QUEUE_HELPER,
  type ReviewsHubDecisionBlockerRow,
} from "@/lib/reviews/reviews-hub-decision-blocker-queue";
import { cn } from "@/lib/utils";

export type ReviewsHubDecisionBlockerQueueStripProps = {
  readonly blockers: readonly ReviewsHubDecisionBlockerRow[];
};

export function ReviewsHubDecisionBlockerQueueStrip(
  props: ReviewsHubDecisionBlockerQueueStripProps,
): React.JSX.Element | null {
  if (props.blockers.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-lg border border-amber-500/30 bg-al-surface-raised px-3 py-3"
      data-testid="reviews-hub-decision-blocker-queue"
      aria-label={REVIEWS_HUB_DECISION_BLOCKER_QUEUE_HEADING}
    >
      <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {REVIEWS_HUB_DECISION_BLOCKER_QUEUE_HEADING}
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {REVIEWS_HUB_DECISION_BLOCKER_QUEUE_HELPER}
      </p>
      <ul className="m-0 mt-2 list-none space-y-2 p-0">
        {props.blockers.map((row) => (
          <li key={row.runId} className="flex flex-wrap items-center gap-2">
            <Link href={row.reviewHref} className={cn(OPERATOR_LINK.nav, "font-medium")}>
              {row.title}
            </Link>
            {row.slaBadge !== null ? (
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{row.slaBadge}</span>
            ) : null}
            {row.waitingOnLabel !== null ? (
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{row.waitingOnLabel}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
