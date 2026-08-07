/** Committed packages expose a manifest; in-progress reviews stay in draft summary mode. */
export type ReviewPackageSummaryMode = "draft" | "finalized";

export function resolveReviewPackageSummaryMode(manifestId: string | null | undefined): ReviewPackageSummaryMode {
  if (typeof manifestId === "string" && manifestId.trim().length > 0) {
    return "finalized";
  }

  return "draft";
}
