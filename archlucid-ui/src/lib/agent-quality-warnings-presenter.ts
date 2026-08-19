import { buyerLabelForAgentType } from "@/lib/agent-type-buyer-label";
import { plainLanguageRejectCategoryLabel } from "@/lib/execution-vs-quality-outcome-copy";
import type {
  AgentExecutionTraceRow,
  AgentOutputEvaluationSummaryPayload,
} from "@/types/agent-forensics";
import { authoritativeAgentEvaluationPerspective } from "@/lib/agent-evaluation-perspective";

/** Default gate floors mirrored from server `AgentOutputQualityGateOptions` (display-only hints). */
export const DEFAULT_STRUCTURAL_WARN_BELOW = 0.85;
export const DEFAULT_STRUCTURAL_REJECT_BELOW = 0.7;
export const DEFAULT_SEMANTIC_WARN_BELOW = 0.65;
export const DEFAULT_SEMANTIC_REJECT_BELOW = 0.5;

export type AgentQualityConcernStatus = "warned" | "rejected";

export type AgentQualityConcernRow = {
  traceId: string;
  agentType: string | number;
  agentLabel: string;
  status: AgentQualityConcernStatus;
  structuralCompletenessRatio: number;
  semanticScore: number | null;
  faithfulnessScore: number | null;
  rejectReasonCategory: string | null;
  rejectReasonLabel: string | null;
  breachedThresholds: string[];
};

function resolveBreachedThresholds(
  structural: number,
  semantic: number | null,
  status: AgentQualityConcernStatus,
): string[] {
  const tags: string[] = [];

  if (status === "rejected")
  {
    if (structural < DEFAULT_STRUCTURAL_REJECT_BELOW)
      tags.push(`Structural below reject floor (${DEFAULT_STRUCTURAL_REJECT_BELOW})`);

    if (semantic !== null && semantic < DEFAULT_SEMANTIC_REJECT_BELOW)
      tags.push(`Semantic below reject floor (${DEFAULT_SEMANTIC_REJECT_BELOW})`);
  }
  else
  {
    if (structural < DEFAULT_STRUCTURAL_WARN_BELOW)
      tags.push(`Structural below warn floor (${DEFAULT_STRUCTURAL_WARN_BELOW})`);

    if (semantic !== null && semantic < DEFAULT_SEMANTIC_WARN_BELOW)
      tags.push(`Semantic below warn floor (${DEFAULT_SEMANTIC_WARN_BELOW})`);
  }

  if (tags.length === 0)
    tags.push("Quality gate flagged this trace");

  return tags;
}

export function buildAgentQualityConcernRows(
  evaluation: AgentOutputEvaluationSummaryPayload | null,
  traces: AgentExecutionTraceRow[],
): AgentQualityConcernRow[] {
  const perspective = authoritativeAgentEvaluationPerspective(evaluation);

  if (!perspective?.scores?.length)
    return [];

  const traceById = new Map(traces.map((t) => [t.traceId, t]));
  const rows: AgentQualityConcernRow[] = [];

  for (const score of perspective.scores)
  {
    const trace = traceById.get(score.traceId);
    const rejected = trace?.qualityRejected === true;
    const warned = score.qualityWarning === true || trace?.qualityWarning === true;

    if (!rejected && !warned)
      continue;

    const structural = score.structuralCompletenessRatio;
    const semantic = score.semantic?.overallSemanticScore ?? null;
    const faithfulness = score.semantic?.agentResultFaithfulnessSupportRatio ?? null;
    const status: AgentQualityConcernStatus = rejected ? "rejected" : "warned";
    const rejectReasonCategory = score.recordedRejectReasonCategory ?? null;

    rows.push({
      traceId: score.traceId,
      agentType: score.agentType,
      agentLabel: buyerLabelForAgentType(score.agentType),
      status,
      structuralCompletenessRatio: structural,
      semanticScore: semantic,
      faithfulnessScore:
        faithfulness === null || faithfulness === undefined || Number.isNaN(Number(faithfulness))
          ? null
          : Number(faithfulness),
      rejectReasonCategory,
      rejectReasonLabel: plainLanguageRejectCategoryLabel(rejectReasonCategory),
      breachedThresholds: resolveBreachedThresholds(structural, semantic, status),
    });
  }

  return rows.sort((a, b) => a.agentLabel.localeCompare(b.agentLabel));
}

export function buildPlainLanguageQualityBlockSummary(rows: AgentQualityConcernRow[]): string | null {
  const rejected = rows.filter((r) => r.status === "rejected");

  if (rejected.length === 0) {
    return null;
  }

  const agents = rejected.map((r) => r.agentLabel).join(", ");

  return `This review is blocked because ${agents} output${rejected.length === 1 ? "" : "s"} failed the quality gate (not an LLM outage). Review the scores below, add evidence or context if needed, then re-run the review. Withhold sponsor-grade real-mode claims until strict AI quality checks pass.`;
}

/** Operator recovery copy for quality-gate rejection runbook links. */
export const QUALITY_GATE_REJECTION_RUNBOOK_PATH = "/help/quality-gate-rejection";

export function hasAgentQualityConcerns(
  evaluation: AgentOutputEvaluationSummaryPayload | null,
  traces: AgentExecutionTraceRow[],
): boolean {
  return buildAgentQualityConcernRows(evaluation, traces).length > 0;
}
