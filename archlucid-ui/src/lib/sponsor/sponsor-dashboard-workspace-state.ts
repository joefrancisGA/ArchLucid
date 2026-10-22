import type { SponsorRoiSummary } from "@/lib/sponsor/sponsor-report-markdown";

/** True when the workspace has at least one committed review in the ROI summary scope. */
export function hasSponsorCommittedReviews(summary: SponsorRoiSummary | null | undefined): boolean {
  if (summary === null || summary === undefined) {
    return false;
  }

  return (summary.systemCount ?? 0) > 0 || (summary.latestRunCount ?? 0) > 0;
}

/** True when ROI summary indicates illustrative or demo-derived pricing/evidence. */
export function isSponsorSampleWorkspaceData(summary: SponsorRoiSummary | null | undefined): boolean {
  if (summary === null || summary === undefined) {
    return false;
  }

  const basis = (summary.savingsPricingBasis ?? "").trim().toLowerCase();

  return basis.includes("demo") || basis.includes("illustrative");
}

/** Empty sponsor dashboard: no committed reviews and not still loading. */
export function isSponsorDashboardEmpty(
  summary: SponsorRoiSummary | null | undefined,
  loading: boolean,
): boolean {
  if (loading) {
    return false;
  }

  return !hasSponsorCommittedReviews(summary);
}
