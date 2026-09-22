import { isSafeReturnPath } from "@/lib/navigation/safe-return-path";

const REVIEW_RETURN_PATH_PREFIX = "/architecture/reviews/" as const;

/** Accept same-origin review routes; reject external or malformed returnTo values. */
export function resolveBackgroundWaitHelpReturnHref(returnTo: string | undefined): string | null {
  const trimmed = returnTo?.trim() ?? "";

  if (trimmed.length === 0 || !trimmed.startsWith(REVIEW_RETURN_PATH_PREFIX)) {
    return null;
  }

  if (trimmed.startsWith("//") || trimmed.includes("://")) {
    return null;
  }

  let pathname = trimmed;
  const hashIndex = pathname.indexOf("#");

  if (hashIndex >= 0) {
    pathname = pathname.slice(0, hashIndex);
  }

  const queryIndex = pathname.indexOf("?");

  if (queryIndex >= 0) {
    pathname = pathname.slice(0, queryIndex);
  }

  if (!pathname.startsWith(REVIEW_RETURN_PATH_PREFIX)) {
    return null;
  }

  const reviewSegment = pathname.slice(REVIEW_RETURN_PATH_PREFIX.length).split("/")[0]?.trim() ?? "";

  if (reviewSegment.length === 0 || reviewSegment === "new") {
    return null;
  }

  return isSafeReturnPath(trimmed) ? trimmed : null;
}

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RETURN_TO_REVIEW_LABEL = "Back to review" as const;
