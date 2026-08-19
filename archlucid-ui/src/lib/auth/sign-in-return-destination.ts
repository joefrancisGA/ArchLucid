import { isSafeReturnPath } from "@/lib/navigation/safe-return-path";

/** Whether sign-in should promise a post-auth return to a specific in-app destination. */
export function signInHasReturnDestination(returnUrl: string | undefined): boolean {
  const trimmed = returnUrl?.trim() ?? "";

  return isSafeReturnPath(trimmed) && trimmed !== "/";
}

export const SIGN_IN_RETURN_DESTINATION_HINT =
  "After you sign in, ArchLucid will return you to the page you were viewing.";
