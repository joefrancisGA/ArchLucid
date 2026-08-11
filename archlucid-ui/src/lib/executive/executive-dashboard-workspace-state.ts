import type { ExecutiveRoiSummary } from "@/lib/executive/executive-summary-markdown";

/** True when the workspace has at least one committed review in the ROI summary scope. */
export function hasExecutiveCommittedReviews(summary: ExecutiveRoiSummary | null | undefined): boolean {
  if (summary === null || summary === undefined) {
    return false;
  }

  return (summary.systemCount ?? 0) > 0 || (summary.latestRunCount ?? 0) > 0;
}

/** True when ROI summary indicates illustrative or demo-derived pricing/evidence. */
export function isExecutiveSampleWorkspaceData(summary: ExecutiveRoiSummary | null | undefined): boolean {
  if (summary === null || summary === undefined) {
    return false;
  }

  const basis = (summary.savingsPricingBasis ?? "").trim().toLowerCase();

  return basis.includes("demo") || basis.includes("illustrative");
}

/** Empty executive dashboard: no committed reviews and not still loading. */
export function isExecutiveDashboardEmpty(
  summary: ExecutiveRoiSummary | null | undefined,
  loading: boolean,
): boolean {
  if (loading) {
    return false;
  }

  return !hasExecutiveCommittedReviews(summary);
}
