"use client";

import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { OperatorWarningCallout } from "@/components/operator/OperatorShellMessage";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReRunReviewOutcomePhase } from "@/lib/re-run-review-outcome-copy";
import { RE_RUN_REVIEW_RUNNING_DETAIL } from "@/lib/re-run-review-outcome-copy";
import { cn } from "@/lib/utils";

export type ReRunReviewOutcomeNoticeProps = {
  readonly phase: ReRunReviewOutcomePhase;
  readonly headline: string;
  readonly className?: string;
};

/** Durable inline acknowledgement for re-run review (TB-2112 pattern — not toast-only). */
export function ReRunReviewOutcomeNotice(props: ReRunReviewOutcomeNoticeProps): React.JSX.Element {
  const { phase, headline, className } = props;

  if (phase === "succeeded") {
    return (
      <OperatorSuccessCallout
        message={headline}
        testId="re-run-review-outcome"
        className={cn("mb-0 mt-2", className)}
      />
    );
  }

  if (phase === "failed") {
    return (
      <div className={cn("mt-2", className)} data-testid="re-run-review-outcome" role="status" aria-live="polite">
        <OperatorWarningCallout>
          <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>{headline}</p>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            The review did not advance. Check the failure details above, then try again after fixing the cause.
          </p>
        </OperatorWarningCallout>
      </div>
    );
  }

  if (phase === "canceled") {
    return (
      <div
        className={cn(DESIGN_TOKENS.callout.info, "mt-2 p-3", className)}
        data-testid="re-run-review-outcome"
        role="status"
        aria-live="polite"
      >
        <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{headline}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.info, "mt-2 p-3", className)}
      data-testid="re-run-review-outcome"
      role="status"
      aria-live="polite"
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{headline}</p>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {RE_RUN_REVIEW_RUNNING_DETAIL}
      </p>
    </div>
  );
}
