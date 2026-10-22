import { isSafeReturnPath } from "@/lib/navigation/safe-return-path";
import { getRouteTitle } from "@/lib/route-titles";

/** Whether sign-in should promise a post-auth return to a specific in-app destination. */
export function signInHasReturnDestination(returnUrl: string | undefined): boolean {
  const trimmed = returnUrl?.trim() ?? "";

  return isSafeReturnPath(trimmed) && trimmed !== "/";
}

/** Human-readable destination label for a safe post-sign-in return path. */
export function resolveReturnDestinationLabel(returnUrl: string | undefined): string | null {
  if (!signInHasReturnDestination(returnUrl)) {
    return null;
  }

  const pathOnly = returnUrl!.split("?")[0] ?? returnUrl!;

  return getRouteTitle(pathOnly);
}

export function formatSessionExpiredReturnHint(destinationLabel: string): string {
  return `Continue where you left off — sign in to return to ${destinationLabel}.`;
}

export const SESSION_EXPIRED_CONTINUE_DESK_LABEL = "Continue where you left off";

export const SIGN_IN_RETURN_DESTINATION_HINT =
  "After you sign in, ArchLucid will return you to the page you were viewing.";
