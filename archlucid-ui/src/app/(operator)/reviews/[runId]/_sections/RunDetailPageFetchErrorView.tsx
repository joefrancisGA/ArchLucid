import { cn } from "@/lib/utils";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { cn } from "@/lib/utils";
import { OperatorBrandedTransientFailure } from "@/components/OperatorBrandedTransientFailure";
import { cn } from "@/lib/utils";
import { ReviewPackageLoadFailureView } from "@/components/ReviewPackageLoadFailureView";
import { cn } from "@/lib/utils";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { cn } from "@/lib/utils";
import { isApiNotFoundFailure, isApiTransientLoadFailure } from "@/lib/api-load-failure";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
            ? "Review generation — Could not open generated package"
            : "Review detail — Could not load review package"}
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
      <div className="w-full max-w-[1200px] space-y-4 px-1 py-2 sm:px-0">
        <h1 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>Review detail</h1>
        <OperatorBrandedTransientFailure failure={props.loadFailure} retryLabel="Retry loading review" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] space-y-4 px-1 py-2 sm:px-0">
      <h1 className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>Review detail</h1>
      <OperatorApiProblem
        problem={props.loadFailure?.problem ?? null}
        fallbackMessage={props.fallbackMessage}
        correlationId={props.loadFailure?.correlationId ?? null}
      />
      <p>
        <Link className={OPERATOR_LINK.nav} href="/reviews?projectId=default">
          ← Back to reviews
        </Link>
      </p>
    </div>
  );
}
