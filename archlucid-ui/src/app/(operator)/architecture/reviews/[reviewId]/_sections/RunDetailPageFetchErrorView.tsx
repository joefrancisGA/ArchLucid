import Link from "next/link";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorBrandedTransientFailure } from "@/components/operator/OperatorBrandedTransientFailure";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ReviewPackageLoadFailureView } from "@/components/ReviewPackageLoadFailureView";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isApiNotFoundFailure, isApiTransientLoadFailure } from "@/lib/api-load-failure";
import { OPERATOR_LAYOUT, OPERATOR_LINK } from "@/lib/design-tokens";
import { REVIEW_PACKAGE_OPEN_FAILURE_HEADING } from "@/lib/review-generation-handoff";
import { cn } from "@/lib/utils";

const runDetailErrorShellClassName = cn(OPERATOR_LAYOUT.sectionStack, "px-1 py-2 sm:px-0");

export function RunDetailPageFetchErrorView(props: {
  readonly runId: string;
  readonly fromGeneration: boolean;
  readonly attemptedRoute: string;
  readonly loadFailure: ApiLoadFailureState | null;
  readonly fallbackMessage: string;
}): React.JSX.Element {
  if (props.fromGeneration || isApiNotFoundFailure(props.loadFailure)) {
    return (
      <OperatorPageContainer
        variant="dashboard"
        className={runDetailErrorShellClassName}
        data-testid="run-detail-load-failure"
      >
        <OperatorPageHeader
          title={
            props.fromGeneration
              ? REVIEW_PACKAGE_OPEN_FAILURE_HEADING
              : "Review detail — Could not load review"
          }
          headingLevel="h1"
        />
        <ReviewPackageLoadFailureView
          runId={props.runId}
          fromGeneration={props.fromGeneration}
          notFoundReason={isApiNotFoundFailure(props.loadFailure) ? "missing" : undefined}
          loadFailure={props.loadFailure}
          attemptedRoute={props.attemptedRoute}
        />
      </OperatorPageContainer>
    );
  }

  if (props.loadFailure !== null && isApiTransientLoadFailure(props.loadFailure)) {
    return (
      <OperatorPageContainer
        variant="dashboard"
        className={runDetailErrorShellClassName}
        data-testid="run-detail-load-failure"
      >
        <OperatorPageHeader title="Review detail" headingLevel="h1" />
        <OperatorBrandedTransientFailure
          failure={props.loadFailure}
          retryLabel="Retry loading review"
          reportProblemSurfaceId="review-detail-hard-load-failure"
        />
      </OperatorPageContainer>
    );
  }

  return (
    <OperatorPageContainer
      variant="dashboard"
      className={runDetailErrorShellClassName}
      data-testid="run-detail-load-failure"
    >
      <OperatorPageHeader title="Review detail" headingLevel="h1" />
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
    </OperatorPageContainer>
  );
}
