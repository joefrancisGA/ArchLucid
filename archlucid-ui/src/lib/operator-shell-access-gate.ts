import { AUTH_MODE } from "@/lib/auth-config";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";

/** Routes that render without operator nav chrome and skip access-gate deferral. */
export function pathnameExemptFromOperatorAccessGate(pathname: string | null): boolean {
  if (pathname === null) {
    return false;
  }

  if (pathname === "/403") {
    return true;
  }

  if (pathname.startsWith("/auth/")) {
    return true;
  }

  return false;
}

/** Shared with `OperatorHomeGate` — when false, operator home must not paint shell chrome yet. */
export function operatorHomeGateAllowsInitialPaint(): boolean {
  if (AUTH_MODE === "development-bypass" || !isJwtAuthMode()) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return isLikelySignedIn();
}

export function operatorHomeGateBlocksInitialPaint(pathname: string | null): boolean {
  if (pathname !== "/") {
    return false;
  }

  return !operatorHomeGateAllowsInitialPaint();
}

/** JWT mode without a browser session — defer shell chrome on any operator route, not only `/`. */
export function unsignedJwtSessionBlocksOperatorShell(pathname: string | null): boolean {
  if (pathnameExemptFromOperatorAccessGate(pathname)) {
    return false;
  }

  if (AUTH_MODE === "development-bypass" || !isJwtAuthMode()) {
    return false;
  }

  if (typeof window === "undefined") {
    return true;
  }

  return !isLikelySignedIn();
}

export function shouldDeferOperatorShellChrome(
  pathname: string | null,
  isAuthorityLoading: boolean,
): boolean {
  if (pathnameExemptFromOperatorAccessGate(pathname)) {
    return false;
  }

  if (unsignedJwtSessionBlocksOperatorShell(pathname)) {
    return true;
  }

  if (isAuthorityLoading) {
    return true;
  }

  return false;
}
