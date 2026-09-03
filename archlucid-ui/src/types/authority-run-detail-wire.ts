import type { components } from "@/lib/openapi-schemas";

/** Agent finding row nested under authority run-detail agent results (wire extensions: message, reasoningTrace). */
export type RunDetailAgentFinding = Pick<
  components["schemas"]["Finding"],
  "category" | "findingId" | "severity"
> & {
  message?: string;
  reasoningTrace?: string | null;
};

/**
 * Explicit wire shape for `RunDetailDto.results` rows — OpenAPI snapshot emits `AgentResult` as `{}`.
 */
export type RunDetailAgentResult = {
  agentType: components["schemas"]["AgentType"];
  cacheServed?: boolean;
  /** Format: double */
  calibratedConfidence?: null | number | string;
  citations?: null | components["schemas"]["Citation"][];
  claims: string[];
  /** Format: double */
  confidence?: number | string;
  /** Format: date-time */
  createdUtc?: string;
  degradationReasonCode?: null | string;
  evidenceRefs: string[];
  findings?: RunDetailAgentFinding[] | null;
  insightDensityCuration?: null | components["schemas"]["InsightDensityCurationSummary"];
  proposedChanges?: unknown;
  reasoningTrace?: null | string;
  resultId: string;
  retrievalGroundingTrace?: unknown;
  runId: string;
  taskId: string;
  taskStructuralExecutionMode?: null | components["schemas"]["StructuralExecutionMode"];
  upstreamResultFingerprints?: null | {
    [key: string]: string;
  };
};
