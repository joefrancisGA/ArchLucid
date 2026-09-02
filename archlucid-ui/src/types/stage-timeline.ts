import type { components } from "@/lib/openapi-schemas";

type StageTimelineSummarySchema = components["schemas"]["StageTimelineSummary"];

/** One authority pipeline stage row (`GET /v1/architecture/review/{runId}/stage-timeline`). */
export type StageTimelineSummary = StageTimelineSummarySchema &
  Required<Pick<StageTimelineSummarySchema, "stageName" | "startedUtc" | "outcomeStatus">>;
