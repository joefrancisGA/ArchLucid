import { cn } from "@/lib/utils";
import Link from "next/link";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorBrandedTransientFailure } from "@/components/operator/OperatorBrandedTransientFailure";
import { ReviewPackageLoadFailureView } from "@/components/ReviewPackageLoadFailureView";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isApiNotFoundFailure, isApiTransientLoadFailure } from "@/lib/api-load-failure";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { REVIEW_PACKAGE_OPEN_FAILURE_HEADING } from "@/lib/review-generation-handoff";

export function RunDetailPageFetchErrorView(props: {
  readonly runId: string;
  readonly fromGeneration: boolean;
  readonly attemptedRoute: string;
  readonly loadFailure: ApiLoadFailureState | null;
  readonly fallbackMessage: string;
}): React.JSX.Element {
  if (props.fromGeneration || isApiNotFoundFailure(props.loadFailure)) {
    return (
      <div className="w-full max-w-[1200px] space-y-4 px-1 py-2 sm:px-0" data-testid="run-detail-load-failure">
        <h1 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>
          {props.fromGeneration
            ? REVIEW_PACKAGE_OPEN_FAILURE_HEADING
            : "Review detail — Could not load review"}
        </h1>
        <ReviewPackageLoadFailureView
          runId={props.runId}
          fromGeneration={props.fromGeneration}
          notFoundReason={isApiNotFoundFailure(props.loadFailure) ? "missing" : undefined}
          loadFailure={props.loadFailure}
          attemptedRoute={props.attemptedRoute}
        />
      </div>
    );
  }

  if (props.loadFailure !== null && isApiTransientLoadFailure(props.loadFailure)) {
    return (
      <div
        className="w-full max-w-[1200px] space-y-4 px-1 py-2 sm:px-0"
        data-testid="run-detail-load-failure"
      >
        <h1 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>Review detail</h1>
        <OperatorBrandedTransientFailure
          failure={props.loadFailure}
          retryLabel="Retry loading review"
          reportProblemSurfaceId="review-detail-hard-load-failure"
        />
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-[1200px] space-y-4 px-1 py-2 sm:px-0"
      data-testid="run-detail-load-failure"
    >
      <h1 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>Review detail</h1>
      <OperatorApiProblem
        problem={props.loadFailure?.problem ?? null}
        fallbackMessage={props.fallbackMessage}
        correlationId={props.loadFailure?.correlationId ?? null}
      />
      <p>
        <Link className={OPERATOR_LINK.nav} href="/architecture/reviews">
          ← Back to reviews
        </Link>
      </p>
    </div>
  );
}
