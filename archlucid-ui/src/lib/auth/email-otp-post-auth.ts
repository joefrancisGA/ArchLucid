import { isSafeReturnPath, resolveSafeReturnPath } from "@/lib/navigation/safe-return-path";
import { consumePostSignInReturnUrl } from "@/lib/oidc/session";

const BOOTSTRAP_PATH = "/auth/bootstrap";

export function resolveEmailOtpPostAuthPath(nextStep: string, returnUrl?: string): string {
  const consumedReturnUrl = consumePostSignInReturnUrl();
  const safeReturn = isSafeReturnPath(returnUrl)
    ? returnUrl
    : consumedReturnUrl !== null && isSafeReturnPath(consumedReturnUrl)
      ? consumedReturnUrl
      : resolveSafeReturnPath(returnUrl);

  const bootstrapQuery =
    safeReturn !== "/" ? `?returnUrl=${encodeURIComponent(safeReturn)}` : "";

  switch (nextStep) {
    case "Complete":
      return safeReturn;
    case "SelectWorkspace":
    case "AcceptInvitation":
    case "CreateWorkspace":
      return `${BOOTSTRAP_PATH}${bootstrapQuery}`;
    default:
      return safeReturn;
  }
}

export function resolveBootstrapCompletePath(returnUrl?: string): string {
  const consumedReturnUrl = consumePostSignInReturnUrl();
  const safeReturn = isSafeReturnPath(returnUrl)
    ? returnUrl
    : consumedReturnUrl !== null && isSafeReturnPath(consumedReturnUrl)
      ? consumedReturnUrl
      : "/";

  return safeReturn;
}
