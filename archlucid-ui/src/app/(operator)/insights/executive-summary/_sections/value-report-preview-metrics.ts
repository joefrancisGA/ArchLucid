import { formatHours, hoursSurfaced } from "@/lib/roi-assumptions";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

export type ValueReportPreviewMetrics = {
  reviewsIncluded: number;
  findingsGenerated: number;
  decisionsRecorded: number;
  estimatedHoursSaved: string;
  openGovernanceRisks: number;
};

export function buildValueReportPreviewMetrics(report: PilotValueReportJson): ValueReportPreviewMetrics {
  const hours = hoursSurfaced({
    critical: report.findingsBySeverity.critical,
    high: report.findingsBySeverity.high,
    medium: report.findingsBySeverity.medium,
    precommitBlocks: 0,
  });

  return {
    reviewsIncluded: report.totalRunsCommitted,
    findingsGenerated: report.totalFindings,
    decisionsRecorded: report.governanceApprovals + report.governanceRejections,
    estimatedHoursSaved: formatHours(hours),
    openGovernanceRisks: report.governancePendingApprovalsNow,
  };
}

export function valueReportHasData(report: PilotValueReportJson | null): boolean {
  if (report === null) {
    return false;
  }

  return report.totalRunsCommitted > 0;
}
