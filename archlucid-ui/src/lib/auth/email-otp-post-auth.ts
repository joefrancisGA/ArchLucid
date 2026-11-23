import { isSafeReturnPath, resolveSafeReturnPath } from "@/lib/navigation/safe-return-path";
import { consumePostSignInReturnUrl } from "@/lib/oidc/session";

const BOOTSTRAP_PATH = "/auth/bootstrap";

function pathWithoutQueryOrHash(candidate: string): string {
  return candidate.split("?")[0]?.split("#")[0] ?? candidate;
}

function isAuthOnboardingReturnPath(candidate: string): boolean {
  const pathOnly = pathWithoutQueryOrHash(candidate);

  return pathOnly === "/auth" || pathOnly.startsWith("/auth/");
}

function isExplicitPostAuthReturn(returnUrl: string | undefined): returnUrl is string {
  if (returnUrl === undefined || returnUrl === "/") {
    return false;
  }

  return isSafeReturnPath(returnUrl);
}

function isStoredDeskReturn(candidate: string | null): candidate is string {
  if (candidate === null || candidate === "/" || isAuthOnboardingReturnPath(candidate)) {
    return false;
  }

  return isSafeReturnPath(candidate);
}

function resolvePostAuthReturnPath(
  returnUrl: string | undefined,
  consumedReturnUrl: string | null,
  fallback: string,
): string {
  if (isExplicitPostAuthReturn(returnUrl)) {
    return returnUrl;
  }

  // The sign-in page passes "/" when the query has no returnUrl. That default must not
  // discard a desk path saved before idle expiry or an OIDC retry.
  if (isStoredDeskReturn(consumedReturnUrl)) {
    return consumedReturnUrl;
  }

  if (returnUrl !== undefined && isSafeReturnPath(returnUrl)) {
    return returnUrl;
  }

  if (consumedReturnUrl !== null && isSafeReturnPath(consumedReturnUrl)) {
    return consumedReturnUrl;
  }

  return fallback;
}

export function resolveEmailOtpPostAuthPath(nextStep: string, returnUrl?: string): string {
  const consumedReturnUrl = consumePostSignInReturnUrl();
  const safeReturn = resolvePostAuthReturnPath(
    returnUrl,
    consumedReturnUrl,
    resolveSafeReturnPath(returnUrl),
  );

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

  return resolvePostAuthReturnPath(returnUrl, consumedReturnUrl, "/");
}
