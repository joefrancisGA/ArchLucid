/** Row from `GET /v1/architecture/run/{runId}/traces` (camelCase JSON). */
export type AgentExecutionTraceRow = {
  traceId: string;
  runId: string;
  taskId: string;
  agentType: number;
  parseSucceeded: boolean;
  blobUploadFailed?: boolean | null;
  createdUtc: string;
};

export type AgentExecutionTraceListPayload = {
  traces: AgentExecutionTraceRow[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

export type AgentOutputEvaluationScoreRow = {
  traceId: string;
  agentType: number;
  structuralCompletenessRatio: number;
  isJsonParseFailure: boolean;
  missingKeys: string[];
};

/** Summary from `GET /v1/architecture/run/{runId}/agent-evaluation`. */
export type AgentOutputEvaluationSummaryPayload = {
  runId: string;
  evaluatedAtUtc: string;
  scores: AgentOutputEvaluationScoreRow[];
  tracesSkippedCount: number;
  averageStructuralCompletenessRatio: number | null;
};
