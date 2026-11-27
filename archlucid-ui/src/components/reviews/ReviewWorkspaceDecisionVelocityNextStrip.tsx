import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  resolveReviewWorkspaceDecisionVelocityNext,
  type ResolveReviewWorkspaceDecisionVelocityNextInput,
} from "@/lib/reviews/resolve-review-workspace-decision-velocity-next";
import { REVIEW_WORKSPACE_DECISION_VELOCITY_HELPER } from "@/lib/reviews/review-workspace-decision-velocity-copy";
import { cn } from "@/lib/utils";

export type ReviewWorkspaceDecisionVelocityNextStripProps = ResolveReviewWorkspaceDecisionVelocityNextInput;

export function ReviewWorkspaceDecisionVelocityNextStrip(
  props: ReviewWorkspaceDecisionVelocityNextStripProps,
): React.JSX.Element | null {
  const next = resolveReviewWorkspaceDecisionVelocityNext(props);

  if (next === null) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="review-workspace-decision-velocity-next-strip"
      aria-label="Decision next step"
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{next.lead}</p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
        {REVIEW_WORKSPACE_DECISION_VELOCITY_HELPER}
      </p>
      <div className="mt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          asChild
          data-testid="review-workspace-decision-velocity-cta"
        >
          <Link href={next.href}>{next.ctaLabel}</Link>
        </Button>
      </div>
    </section>
  );
}
