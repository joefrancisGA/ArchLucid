/** Validated same-origin return links from review Evidence tab help launches. */
import { isSafeReturnPath } from "@/lib/navigation/safe-return-path";

const REVIEW_EVIDENCE_RETURN_PATH_PREFIX = "/architecture/reviews/" as const;

function targetsReviewEvidenceTab(pathname: string, search: string, hash: string): boolean {
  if (hash === "#evidence" || hash === "#capture-evidence") {
    return true;
  }

  const params = new URLSearchParams(search);

  return params.get("tab") === "evidence" || params.get("reviewTab") === "evidence";
}

/** Accept same-origin review routes that deep-link the Evidence tab; ignore invalid returnTo. */
export function resolveInspectStoredEvidenceHelpReturnHref(returnTo: string | undefined): string | null {
  const trimmed = returnTo?.trim() ?? "";

  if (trimmed.length === 0 || !trimmed.startsWith(REVIEW_EVIDENCE_RETURN_PATH_PREFIX)) {
    return null;
  }

  if (trimmed.startsWith("//") || trimmed.includes("://")) {
    return null;
  }

  let pathname = trimmed;
  let search = "";
  let hash = "";

  const hashIndex = pathname.indexOf("#");

  if (hashIndex >= 0) {
    hash = pathname.slice(hashIndex);
    pathname = pathname.slice(0, hashIndex);
  }

  const queryIndex = pathname.indexOf("?");

  if (queryIndex >= 0) {
    search = pathname.slice(queryIndex);
    pathname = pathname.slice(0, queryIndex);
  }

  if (!pathname.startsWith(REVIEW_EVIDENCE_RETURN_PATH_PREFIX)) {
    return null;
  }

  const reviewSegment = pathname.slice(REVIEW_EVIDENCE_RETURN_PATH_PREFIX.length).split("/")[0]?.trim() ?? "";

  if (reviewSegment.length === 0 || reviewSegment === "new") {
    return null;
  }

  if (!targetsReviewEvidenceTab(pathname, search, hash)) {
    return null;
  }

  return isSafeReturnPath(trimmed) ? trimmed : null;
}

export const EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RETURN_TO_REVIEW_EVIDENCE_LABEL =
  "Back to review evidence" as const;

type RecentViewEntry = {
  readonly href: string;
};

type RecentViewsState = {
  readonly entries: readonly RecentViewEntry[];
};

/** Resume review Evidence tab from operator recent views when returnTo is absent. */
export function resolveInspectStoredEvidenceHelpReturnHrefFromRecentViews(
  recentViews: RecentViewsState,
): string | null {
  for (const entry of recentViews.entries) {
    const resolved = resolveInspectStoredEvidenceHelpReturnHref(entry.href);

    if (resolved !== null) {
      return resolved;
    }
  }

  return null;
}
