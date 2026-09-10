"use client";

import { PostAuthBootstrapExitActions } from "@/app/(operator)/auth/bootstrap/PostAuthBootstrapExitActions";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { AUTH_SIGNIN_FATAL_ERROR_TITLE } from "@/lib/auth/auth-signin-page-copy";

type SignInStepErrorRecoveryProps = {
  readonly errorCode: string;
};

/** Report Problem + secondary exits when a sign-in step hits infrastructure failure (TB-1316 parity). */
export function SignInStepErrorRecovery({ errorCode }: SignInStepErrorRecoveryProps): React.JSX.Element {
  return (
    <>
      <FatalPageReportProblemSupportRow
        surfaceId="auth-signin-cannot-proceed"
        routePath="/auth/signin"
        errorTitle={AUTH_SIGNIN_FATAL_ERROR_TITLE}
        errorCode={errorCode}
      />
      <PostAuthBootstrapExitActions />
    </>
  );
}
