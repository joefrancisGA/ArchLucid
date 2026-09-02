import type { components } from "@/lib/openapi-schemas";

type PilotValueReportSeveritySchema = components["schemas"]["PilotValueReportSeverityBreakdown"];

export type PilotValueReportSeverityJson = PilotValueReportSeveritySchema &
  Required<Pick<PilotValueReportSeveritySchema, "critical" | "high" | "medium" | "low" | "info">>;

type PilotValueReportTimelineRowSchema = components["schemas"]["PilotValueReportRunTimelinePoint"];

export type PilotValueReportTimelineRow = PilotValueReportTimelineRowSchema &
  Required<Pick<PilotValueReportTimelineRowSchema, "runId" | "createdUtc" | "systemName" | "committedUtc">>;

type PilotValueReportSchema = components["schemas"]["PilotValueReport"];

export type PilotValueReportJson = Omit<
  PilotValueReportSchema,
  "findingsBySeverity" | "committedRunsTimeline"
> &
  Required<
    Pick<
      PilotValueReportSchema,
      | "tenantId"
      | "fromUtc"
      | "toUtc"
      | "totalRunsCommitted"
      | "runDetailsTruncated"
      | "runDetailCap"
      | "totalFindings"
      | "governanceApprovals"
      | "governanceRejections"
      | "governancePendingApprovalsNow"
      | "policyPackAssignments"
      | "comparisonOrDriftDetections"
      | "totalRecommendationsProduced"
      | "uniqueAgentTypes"
      | "auditExportTruncated"
    >
  > & {
    findingsBySeverity: PilotValueReportSeverityJson;
    committedRunsTimeline: PilotValueReportTimelineRow[];
    averagePipelineCompletionSeconds: number | null;
  };
