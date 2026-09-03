import type { components } from "@/lib/openapi-schemas";

/** Row from `GET /v1/architecture/review/{runId}/traces` (camelCase JSON). */
export type AgentExecutionTraceRow = components["schemas"]["AgentExecutionTraceSummary"] & {
  /** Redacted inline fields; execute-tier UI may preview — full blobs when blob upload succeeded. */
  userPrompt?: string | null;
  rawResponse?: string | null;
  systemPrompt?: string | null;
  parsedResultJson?: string | null;
};

/** Inline prompt/response fields joined to tool-invocation forensics rows (TB-110). */
export type AgentTraceRawSnapshot = Pick<
  AgentExecutionTraceRow,
  "userPrompt" | "rawResponse" | "systemPrompt" | "parsedResultJson"
>;

export type AgentExecutionTraceListPayload = components["schemas"]["AgentExecutionTraceResponse"];

/** Nested semantic payload under each evaluation row (`AgentOutputSemanticScore`). */
export type AgentOutputSemanticScoreRow = components["schemas"]["AgentOutputSemanticScore"];

export type AgentOutputEvaluationScoreRow = components["schemas"]["AgentOutputEvaluationScore"];

export type AgentOutputEvaluationPerspectivePayload = components["schemas"]["AgentOutputEvaluationPerspective"];

export type AgentOutputEvaluationSummaryPayload = components["schemas"]["AgentOutputEvaluationSummary"];

/** Row from `GET /v1/architecture/review/{runId}/tool-invocation-forensics` (TB-110). */
export type RunToolInvocationForensicRow = components["schemas"]["RunToolInvocationForensicRow"];

export type RunToolInvocationForensicsPayload = components["schemas"]["RunToolInvocationForensicsResponse"];

export type RunRetrievalGroundingScoreSummary = components["schemas"]["RunRetrievalGroundingScoreSummary"];

export type RunRetrievalGroundingRow = components["schemas"]["RunRetrievalGroundingRow"];

export type RunRetrievalGroundingPayload = components["schemas"]["RunRetrievalGroundingResponse"];
