import type { components } from "@/lib/openapi-schemas";

/** Row from `GET /v1/architecture/review/{runId}/traces` (camelCase JSON). */
export type AgentExecutionTraceRow = {
  traceId: string;
  runId: string;
  taskId: string;
  agentType: string | number;
  parseSucceeded: boolean;
  blobUploadFailed?: boolean | null;
  qualityWarning?: boolean;
  qualityRejected?: boolean;
  createdUtc: string;
  /** Governed customer-facing alias (TB-871); prefer over deployment name in UI. */
  modelAlias?: string | null;
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

export type AgentExecutionTraceListPayload = {
  traces: AgentExecutionTraceRow[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

/** Row from `GET /v1/architecture/review/{runId}/tool-invocation-forensics` (TB-110). */
export type RunToolInvocationForensicRow = components["schemas"]["RunToolInvocationForensicRow"];

export type RunToolInvocationForensicsPayload = components["schemas"]["RunToolInvocationForensicsResponse"];
