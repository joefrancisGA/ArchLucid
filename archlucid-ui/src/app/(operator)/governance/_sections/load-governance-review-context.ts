import { getRunDetail, getRunSummary } from "@/lib/api";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";

export type GovernanceReviewContextLoad = {
  readonly displayTitle: string | null;
  readonly manifestVersion: string | null;
};

/**
 * Loads buyer-facing review title + current signed-record version for approval-queue scoping.
 * Failures are soft — callers keep GUID / empty version fallbacks.
 */
export async function loadGovernanceReviewContext(runId: string): Promise<GovernanceReviewContextLoad> {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return { displayTitle: null, manifestVersion: null };
  }

  const [summaryResult, detailResult] = await Promise.allSettled([
    getRunSummary(trimmed),
    getRunDetail(trimmed),
  ]);

  let displayTitle: string | null = null;

  if (summaryResult.status === "fulfilled") {
    displayTitle = buyerFacingReviewTitleFromSummary(summaryResult.value);
  }

  let manifestVersion: string | null = null;

  if (detailResult.status === "fulfilled") {
    const version = detailResult.value.data?.run?.currentManifestVersion?.trim() ?? "";

    if (version.length > 0) {
      manifestVersion = version;
    }
  }

  return { displayTitle, manifestVersion };
}
