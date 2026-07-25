import type { OperatorHomeWorkspaceMetricsSnapshot } from "@/lib/operator-home-workspace-metrics";

/**
 * One-line portfolio outcome for Recent reviews — committed/active counts plus finding/warning pressure.
 */
export function formatOperatorHomeRecentReviewsOutcome(
  metrics: OperatorHomeWorkspaceMetricsSnapshot,
): string {
  if (!metrics.hasReviews) {
    return "No reviews in this workspace yet.";
  }

  const committed = metrics.reviewPackagesCommitted;
  const active = metrics.reviewPackagesActive;
  const packagePart =
    active > 0
      ? `${committed} committed · ${active} active`
      : `${committed} committed`;

  const pressureParts: string[] = [];

  if (metrics.openFindings > 0) {
    pressureParts.push(
      `${metrics.openFindings} open finding${metrics.openFindings === 1 ? "" : "s"}`,
    );
  }

  if (metrics.governanceWarnings > 0) {
    pressureParts.push(
      `${metrics.governanceWarnings} with governance warnings`,
    );
  }

  if (pressureParts.length === 0) {
    return `${packagePart} · no open finding pressure`;
  }

  return `${packagePart} · ${pressureParts.join(" · ")}`;
}

/** Featured recent-review rows on Overview (full list lives on Architecture packages). */
export const OPERATOR_HOME_RECENT_FEATURED_LIMIT = 2;
