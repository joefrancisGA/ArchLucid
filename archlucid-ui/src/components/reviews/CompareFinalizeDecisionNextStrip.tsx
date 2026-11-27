import Link from "next/link";

import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  COMPARE_FINALIZE_DECISION_HUB_CTA,
  COMPARE_FINALIZE_DECISION_LEAD,
  COMPARE_FINALIZE_ONE_REVIEW_LEAD,
} from "@/lib/reviews/compare-finalize-decision-velocity-copy";
import { cn } from "@/lib/utils";

export type CompareFinalizeDecisionNextStripProps = {
  readonly finalizedCount: number;
  readonly loading: boolean;
};

export function CompareFinalizeDecisionNextStrip(
  props: CompareFinalizeDecisionNextStripProps,
): React.JSX.Element | null {
  if (props.loading) {
    return null;
  }

  const lead =
    props.finalizedCount === 1 ? COMPARE_FINALIZE_ONE_REVIEW_LEAD : COMPARE_FINALIZE_DECISION_LEAD;

  return (
    <section
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="compare-finalize-decision-next-strip"
      aria-label="Finalize before compare"
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{lead}</p>
      <div className="mt-2">
        <Button type="button" variant="outline" size="sm" asChild data-testid="compare-finalize-decision-hub-cta">
          <Link href={REVIEWS_LIST_PATH}>{COMPARE_FINALIZE_DECISION_HUB_CTA}</Link>
        </Button>
      </div>
    </section>
  );
}
