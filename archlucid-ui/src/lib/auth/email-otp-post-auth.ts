import { isSafeReturnPath, resolveSafeReturnPath } from "@/lib/navigation/safe-return-path";
import { consumePostSignInReturnUrl } from "@/lib/oidc/session";

export function resolveEmailOtpPostAuthPath(nextStep: string, returnUrl?: string): string {
  const safeReturn = isSafeReturnPath(returnUrl)
    ? returnUrl
    : (consumePostSignInReturnUrl() ?? resolveSafeReturnPath(returnUrl));

  switch (nextStep) {
    case "Complete":
      return safeReturn;
    case "SelectWorkspace":
      return "/";
    case "AcceptInvitation":
      return "/signup";
    case "CreateWorkspace":
      return "/signup";
    default:
      return safeReturn;
  }
}
