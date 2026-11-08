import type { SponsorOrphanCandidateSummary } from "@/lib/sponsor/sponsor-report-markdown";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import type { PilotValueReportTimelineRow } from "@/types/pilot-value-report";

export type SponsorScorecardRecommendedAction = {
  readonly id: string;
  readonly headline: string;
  readonly explanation: string;
  readonly href: string;
  /** Higher sorts first — estimated USD impact or days overdue. */
  readonly sortWeight: number;
};

export type BuildSponsorScorecardRecommendedActionsInput = {
  readonly complianceDriftChangeCount: number;
  readonly orphanCandidates: SponsorOrphanCandidateSummary | null | undefined;
  readonly committedRunsTimeline: readonly PilotValueReportTimelineRow[];
};

function daysSinceUtc(isoUtc: string): number | null {
  const ms = Date.parse(isoUtc);

  if (Number.isNaN(ms)) {
    return null;
  }

  return Math.floor((Date.now() - ms) / 86_400_000);
}

function formatUsdCompact(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function findMostOverduePendingReview(
  timeline: readonly PilotValueReportTimelineRow[],
): { systemName: string; runId: string; daysPending: number } | null {
  let best: { systemName: string; runId: string; daysPending: number } | null = null;

  for (const row of timeline) {
    if (row.committedUtc !== null && row.committedUtc.trim().length > 0) {
      continue;
    }

    const days = daysSinceUtc(row.createdUtc);

    if (days === null) {
      continue;
    }

    if (best === null || days > best.daysPending) {
      best = {
        systemName:
          row.systemName.trim().length > 0 ? row.systemName.trim() : "Review title was not stored.",
        runId: row.runId,
        daysPending: days,
      };
    }
  }

  return best;
}

/** Derives up to three sponsor-facing next steps from scorecard-loaded signals (TB-247). */
export function buildSponsorScorecardRecommendedActions(
  input: BuildSponsorScorecardRecommendedActionsInput,
): SponsorScorecardRecommendedAction[] {
  const candidates: SponsorScorecardRecommendedAction[] = [];
  const orphan = input.orphanCandidates;
  const orphanCount =
    typeof orphan?.candidateCount === "number" && Number.isFinite(orphan.candidateCount)
      ? orphan.candidateCount
      : null;
  const orphanSavings = orphan?.annualSavingsUsd;

  if (input.complianceDriftChangeCount > 0) {
    const n = input.complianceDriftChangeCount;

    candidates.push({
      id: "compliance-drift",
      headline: `Review ${n} drifted ${n === 1 ? "policy change" : "policy changes"}`,
      explanation: `Your team recorded ${n} compliance drift ${n === 1 ? "event" : "events"} in this range. Open workspace health to inspect policy pack activity.`,
      href: GOVERNANCE_WORKSPACE_HEALTH_HREF,
      sortWeight: n,
    });
  }

  if (orphanCount !== null && orphanCount > 0 && typeof orphanSavings === "number" && Number.isFinite(orphanSavings) && orphanSavings > 0) {
    candidates.push({
      id: "orphan-candidates",
      headline: `Reclaim ${formatUsdCompact(orphanSavings)} in orphan candidates`,
      explanation: `${orphanCount} ${orphanCount === 1 ? "resource is" : "resources are"} flagged for decommission review on the latest committed evidence.`,
      href: "/architecture/reviews?filter=orphan-candidates",
      sortWeight: orphanSavings,
    });
  } else if (orphanCount !== null && orphanCount > 0) {
    const savingsNote =
      typeof orphanSavings === "number" && Number.isFinite(orphanSavings)
        ? ""
        : " Annual savings were not stored.";
    candidates.push({
      id: "orphan-candidates",
      headline: `Review ${orphanCount} orphan ${orphanCount === 1 ? "candidate" : "candidates"}`,
      explanation: `Open the reviews list filtered to orphan-candidate evidence from your latest ROI summary.${savingsNote}`,
      href: "/architecture/reviews?filter=orphan-candidates",
      sortWeight: orphanCount,
    });
  }

  const overdue = findMostOverduePendingReview(input.committedRunsTimeline);

  if (overdue !== null && overdue.daysPending > 30) {
    candidates.push({
      id: "overdue-review",
      headline: "Complete overdue architecture review",
      explanation: `'${overdue.systemName}' has been pending for ${overdue.daysPending} days.`,
      href: `/architecture/reviews/${encodeURIComponent(overdue.runId)}`,
      sortWeight: overdue.daysPending,
    });
  }

  if (candidates.length === 0 && orphanCount === null) {
    candidates.push({
      id: "orphan-count-not-stored",
      headline: "Orphan candidate count was not stored.",
      explanation:
        "The sponsor ROI summary did not include an orphan candidate count for this range — open workspace health or refresh the summary before prioritizing decommission work.",
      href: GOVERNANCE_WORKSPACE_HEALTH_HREF,
      sortWeight: 0,
    });
  }

  return candidates.sort((a, b) => b.sortWeight - a.sortWeight).slice(0, 3);
}
