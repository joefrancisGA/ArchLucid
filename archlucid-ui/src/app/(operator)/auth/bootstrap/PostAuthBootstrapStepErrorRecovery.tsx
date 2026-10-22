"use client";

import { PostAuthBootstrapExitActions } from "@/app/(operator)/auth/bootstrap/PostAuthBootstrapExitActions";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";

type PostAuthBootstrapStepErrorRecoveryProps = {
  readonly errorTitle: string;
  readonly errorCode: string;
};

/** Report Problem + secondary exits when a bootstrap step fails mid-flow (TB-1469 parity). */
export function PostAuthBootstrapStepErrorRecovery({
  errorTitle,
  errorCode,
}: PostAuthBootstrapStepErrorRecoveryProps): React.JSX.Element {
  return (
    <>
      <FatalPageReportProblemSupportRow
        surfaceId="auth-bootstrap-cannot-complete"
        routePath="/auth/bootstrap"
        errorTitle={errorTitle}
        errorCode={errorCode}
      />
      <PostAuthBootstrapExitActions />
    </>
  );
}
