import { coerceComplianceRuleKey, inferPolicyPackDisplayNameFromComplianceRuleKey } from "@/lib/policy-pack-rule-key-prefix-catalog";
import { firstRecommendationSentence, type QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { parseFindingWireDerivationFields } from "@/lib/finding-derivation-sentence";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import type { FindingInspectPayload } from "@/types/finding-inspect";

/** Honest empty label when a causal step has no payload field (TB-2217). */
export const FINDING_CAUSAL_STEP_MISSING = "Not available";

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
  readonly evidenceRefCount?: number | null;
  readonly recommendation?: string | null;
};

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
    return inferPolicyPackDisplayNameFromComplianceRuleKey(ruleId) ?? ruleId;
  }

  return null;
}

function resolveEvidenceValue(input: FindingCausalMiniChainInput): string | null {
  const explicit = nonEmpty(input.evidenceLabel);

  if (explicit !== null) {
    return explicit;
  }

  const count =
    typeof input.evidenceRefCount === "number" && Number.isFinite(input.evidenceRefCount)
      ? Math.max(0, Math.trunc(input.evidenceRefCount))
      : null;

  if (count !== null && count > 0) {
    return `${count} cited evidence reference${count === 1 ? "" : "s"}`;
  }

  return null;
}

function resolveRecommendationValue(input: FindingCausalMiniChainInput): string | null {
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
    evidenceLabel: nonEmpty(finding.traceConfidenceLabel),
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
  const recommendation =
    payload.recommendedActions.find((action) => action.trim().length > 0) ?? payload.reasoningSummary ?? null;

  return buildFindingCausalMiniChain({
    ruleName: payload.decisionRuleName,
    ruleId: payload.decisionRuleId,
    evidenceRefCount: payload.evidence?.length ?? 0,
    recommendation,
  });
}