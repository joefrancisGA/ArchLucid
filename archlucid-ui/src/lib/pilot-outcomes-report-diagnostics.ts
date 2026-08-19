import type { PilotValueReportJson, PilotValueReportTimelineRow } from "@/types/pilot-value-report";

export type PilotOutcomesEmptyDiagnostics = {
  readonly reportingPeriodLabel: string;
  readonly reviewsFinalized: number;
  readonly reviewsInTimeline: number;
  readonly mostRecentFinalizedUtc: string | null;
  readonly mostRecentFinalizedRunId: string | null;
  readonly includesSampleData: boolean;
  readonly hasQualifyingData: boolean;
};

export function formatPilotOutcomesReportingPeriod(fromUtc: string, toUtc: string): string {
  const from = new Date(fromUtc);
  const to = new Date(toUtc);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return `${fromUtc} — ${toUtc}`;
  }

  const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

  return `${dateFmt.format(from)} — ${dateFmt.format(to)}`;
}

function resolveMostRecentFinalizedTimelineRow(
  timeline: readonly PilotValueReportTimelineRow[],
): PilotValueReportTimelineRow | null {
  const finalizedRows = timeline
    .filter(
      (row): row is PilotValueReportTimelineRow & { committedUtc: string } =>
        row.committedUtc !== null && row.committedUtc.length > 0 && row.runId.trim().length > 0,
    )
    .sort((left, right) => right.committedUtc.localeCompare(left.committedUtc));

  return finalizedRows[0] ?? null;
}

export function buildPilotOutcomesMostRecentFinalizedReviewHref(runId: string | null): string | null {
  if (runId === null) {
    return null;
  }

  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return null;
  }

  return `/architecture/reviews/${encodeURIComponent(trimmedRunId)}`;
}

export function buildPilotOutcomesEmptyDiagnostics(
  report: PilotValueReportJson | null,
  fromUtc: string,
  toUtc: string,
  includesSampleData: boolean,
): PilotOutcomesEmptyDiagnostics {
  const timeline = report?.committedRunsTimeline ?? [];
  const mostRecentFinalizedRow = resolveMostRecentFinalizedTimelineRow(timeline);

  return {
    reportingPeriodLabel:
      report !== null
        ? formatPilotOutcomesReportingPeriod(report.fromUtc, report.toUtc)
        : formatPilotOutcomesReportingPeriod(new Date(fromUtc).toISOString(), new Date(toUtc).toISOString()),
    reviewsFinalized: report?.totalRunsCommitted ?? 0,
    reviewsInTimeline: timeline.length,
    mostRecentFinalizedUtc: mostRecentFinalizedRow?.committedUtc ?? null,
    mostRecentFinalizedRunId: mostRecentFinalizedRow?.runId ?? null,
    includesSampleData,
    hasQualifyingData: (report?.totalRunsCommitted ?? 0) > 0,
  };
}

export function pilotOutcomesReportHasFinalizedReviews(report: PilotValueReportJson | null): boolean {
  if (report === null) {
    return false;
  }

  return report.totalRunsCommitted > 0;
}
