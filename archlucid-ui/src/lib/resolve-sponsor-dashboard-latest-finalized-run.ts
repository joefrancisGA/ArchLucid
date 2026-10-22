import type { SponsorRoiSummary } from "@/lib/sponsor/sponsor-summary-markdown";

/** Most recently committed finalized review run id from sponsor dashboard summary. */
export function resolveSponsorDashboardLatestFinalizedRunId(
  summary: SponsorRoiSummary | null | undefined,
): string | null {
  if (summary === null || summary === undefined || summary.systems.length === 0) {
    return null;
  }

  const sortedSystems = summary.systems
    .slice()
    .sort((left, right) => (right.committedUtc ?? "").localeCompare(left.committedUtc ?? ""));

  const runId = sortedSystems[0]?.runId.trim() ?? "";

  return runId.length > 0 ? runId : null;
}
