import type { PilotValueReportJson } from "@/types/pilot-value-report";

export type PilotOutcomesEmptyDiagnostics = {
  readonly reportingPeriodLabel: string;
  readonly reviewsFinalized: number;
  readonly reviewsInTimeline: number;
  readonly mostRecentFinalizedUtc: string | null;
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

export function buildPilotOutcomesEmptyDiagnostics(
  report: PilotValueReportJson | null,
  fromUtc: string,
  toUtc: string,
  includesSampleData: boolean,
): PilotOutcomesEmptyDiagnostics {
  const timeline = report?.committedRunsTimeline ?? [];
  const finalizedDates = timeline
    .map((row) => row.committedUtc)
    .filter((value): value is string => value !== null && value.length > 0)
    .sort((a, b) => b.localeCompare(a));

  return {
    reportingPeriodLabel:
      report !== null
        ? formatPilotOutcomesReportingPeriod(report.fromUtc, report.toUtc)
        : formatPilotOutcomesReportingPeriod(new Date(fromUtc).toISOString(), new Date(toUtc).toISOString()),
    reviewsFinalized: report?.totalRunsCommitted ?? 0,
    reviewsInTimeline: timeline.length,
    mostRecentFinalizedUtc: finalizedDates[0] ?? null,
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
