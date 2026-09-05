import type { AgentOutputSemanticScoreRow } from "@/types/agent-forensics-scores-semantic";

export type AgentOutputEvaluationScoreRow = {
  traceId: string;
  agentType: string | number;
  structuralCompletenessRatio: number;
  isJsonParseFailure: boolean;
  missingKeys: string[];
  semantic?: AgentOutputSemanticScoreRow | null;
  blobUploadFailed?: boolean | null;
  qualityWarning?: boolean;
  /** Persisted reject reason category from evaluate-time gate (structural | semantic | faithfulness). */
  recordedRejectReasonCategory?: string | null;
};

export type AgentOutputEvaluationPerspectivePayload = {
  authority: "recorded" | "advisoryCurrent";
  gateDefinition?: {
    definitionVersion: string;
    contentHashSha256: string;
    mode: string;
    effectiveFromUtc: string;
    deprecatedReason?: string | null;
  } | null;
  scores: AgentOutputEvaluationScoreRow[];
  tracesSkippedCount: number;
  averageStructuralCompletenessRatio: number | null;
  averageSemanticScore: number | null;
  aggregateQualityGateOutcome?: number | null;
};

export type AgentOutputEvaluationSummaryPayload = {
  runId: string;
  evaluatedAtUtc: string;
  recorded?: AgentOutputEvaluationPerspectivePayload | null;
  advisoryCurrent: AgentOutputEvaluationPerspectivePayload;
};
