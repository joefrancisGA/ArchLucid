import { coerceComplianceRuleKey } from "@/lib/policy/policy-pack-rule-key-prefix-catalog";

export const FINDING_CAUSAL_RULE_NAME_NOT_STORED = "Rule name was not stored.";
import { firstRecommendationSentence, type QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { parseFindingWireDerivationFields } from "@/lib/findings/finding-derivation-sentence";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import type { FindingInspectPayload } from "@/types/finding-inspect";

export const FINDING_CAUSAL_RULE_MISSING = "Rule was not stored";
export const FINDING_CAUSAL_EVIDENCE_MISSING = "Evidence was not stored";
export const FINDING_CAUSAL_RECOMMENDATION_MISSING = "Recommendation was not stored";
export const FINDING_CAUSAL_RECOMMENDATION_STORED_EMPTY = "Recommendation was stored empty.";

export type FindingCausalMiniChainStepKey = "rule" | "evidence" | "recommendation";

export type FindingCausalMiniChainStep = {
  readonly key: FindingCausalMiniChainStepKey;
  readonly label: string;
  readonly value: string | null;
};

export type FindingCausalMiniChainResult = {
  readonly steps: readonly FindingCausalMiniChainStep[];
  /** True when at least one step has a non-empty value. */
  readonly hasAnyValue: boolean;
};

export type FindingCausalMiniChainInput = {
  readonly ruleName?: string | null;
  readonly ruleId?: string | null;
  readonly evidenceLabel?: string | null;
  readonly traceConfidenceLabel?: string | null;
  readonly evidenceRefCount?: number | null;
  readonly recommendation?: string | null;
};

const TRACE_CONFIDENCE_NOT_ARTIFACT_SUFFIX = "This is not a cited evidence artifact.";

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

function resolveRuleValue(input: FindingCausalMiniChainInput): string | null {
  const explicitName = nonEmpty(input.ruleName);

  if (explicitName !== null) {
    return explicitName;
  }

  const ruleId = nonEmpty(input.ruleId);

  if (ruleId !== null) {
    return `${ruleId} · ${FINDING_CAUSAL_RULE_NAME_NOT_STORED}`;
  }

  return null;
}

function resolveEvidenceValue(input: FindingCausalMiniChainInput): string | null {
  const count =
    typeof input.evidenceRefCount === "number" && Number.isFinite(input.evidenceRefCount)
      ? Math.max(0, Math.trunc(input.evidenceRefCount))
      : null;

  const traceConfidence = nonEmpty(input.traceConfidenceLabel);
  const explicitLabel = nonEmpty(input.evidenceLabel);

  const parts: string[] = [];

  if (count !== null && count >= 0) {
    parts.push(`${count} cited evidence reference${count === 1 ? "" : "s"}`);
  } else if (explicitLabel !== null) {
    parts.push(explicitLabel);
  }

  if (traceConfidence !== null) {
    parts.push(`Trace confidence: ${traceConfidence}. ${TRACE_CONFIDENCE_NOT_ARTIFACT_SUFFIX}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(" ");
}

function resolveRecommendationValue(input: FindingCausalMiniChainInput): string | null {
  if (input.recommendation === null || input.recommendation === undefined) {
    return null;
  }

  if (input.recommendation.trim().length === 0) {
    return FINDING_CAUSAL_RECOMMENDATION_STORED_EMPTY;
  }

  const raw = nonEmpty(input.recommendation);

  if (raw === null) {
    return null;
  }

  const sentence = firstRecommendationSentence(raw);

  return sentence.length > 0 ? sentence : raw;
}

/** Builds rule → evidence → recommendation steps from available finding fields — never fabricates missing steps. */
export function buildFindingCausalMiniChain(input: FindingCausalMiniChainInput): FindingCausalMiniChainResult {
  const steps: FindingCausalMiniChainStep[] = [
    { key: "rule", label: "Rule", value: resolveRuleValue(input) },
    { key: "evidence", label: "Evidence", value: resolveEvidenceValue(input) },
    { key: "recommendation", label: "Recommendation", value: resolveRecommendationValue(input) },
  ];

  return {
    steps,
    hasAnyValue: steps.some((step) => step.value !== null),
  };
}

export function findingCausalMiniChainFromQuickDecisionFinding(
  finding: QuickDecisionFinding,
): FindingCausalMiniChainResult {
  const wire = parseFindingWireDerivationFields(finding.aiReasoning.wireJson);

  return buildFindingCausalMiniChain({
    ruleName: wire.decisionRuleName,
    ruleId: finding.policyRuleId ?? wire.decisionRuleId,
    evidenceRefCount: finding.evidenceRefCount,
    traceConfidenceLabel: finding.traceConfidenceLabel,
    recommendation: finding.recommendation,
  });
}

export function findingCausalMiniChainFromGovernanceQueueRow(
  row: GovernanceFindingQueueRow,
): FindingCausalMiniChainResult | null {
  if (row.recordKind !== "finding") {
    return null;
  }

  const policyRuleId = row.policyRuleId ?? coerceComplianceRuleKey(row.category);

  return buildFindingCausalMiniChain({
    ruleId: policyRuleId,
    evidenceRefCount: row.evidenceRefCount,
    recommendation: row.recommended,
  });
}

export function findingCausalMiniChainFromInspectPayload(
  payload: FindingInspectPayload,
): FindingCausalMiniChainResult {
  const recommendation = payload.recommendedActions.find((action) => action.trim().length > 0) ?? null;

  return buildFindingCausalMiniChain({
    ruleName: payload.decisionRuleName,
    ruleId: payload.decisionRuleId,
    evidenceRefCount:
      payload.evidenceListReturned === false ? null : payload.evidence.length,
    recommendation,
  });
}