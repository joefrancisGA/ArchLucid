import { coerceComplianceRuleKey, inferPolicyPackDisplayNameFromComplianceRuleKey } from "@/lib/policy/policy-pack-rule-key-prefix-catalog";
import { firstRecommendationSentence, severityBadgeLabel, type QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

export const FINDING_DERIVATION_NOT_AVAILABLE = "Derivation not available";

export type FindingDerivationInput = {
  readonly ruleName?: string | null;
  readonly ruleId?: string | null;
  readonly categoryLabel?: string | null;
  readonly severityLabel?: string | null;
  readonly evidenceRefCount?: number | null;
  readonly evidenceClass?: string | null;
  readonly reasoningSummary?: string | null;
};

export type FindingDerivationResult = {
  readonly sentence: string;
  /** True when the sentence was synthesized from structured fields rather than API reasoning text. */
  readonly synthesised: boolean;
};

type FindingWireDerivationFields = {
  readonly decisionRuleName?: string;
  readonly reasoningSummary?: string;
  readonly decisionRuleId?: string;
};

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

function resolveRuleLabel(input: FindingDerivationInput): string | null {
  const explicitName = nonEmpty(input.ruleName);

  if (explicitName !== null) {
    return explicitName;
  }

  const ruleId = nonEmpty(input.ruleId);

  if (ruleId !== null) {
    return inferPolicyPackDisplayNameFromComplianceRuleKey(ruleId) ?? ruleId;
  }

  return nonEmpty(input.categoryLabel);
}

function evidencePhrase(input: FindingDerivationInput): string | null {
  const count =
    typeof input.evidenceRefCount === "number" && Number.isFinite(input.evidenceRefCount)
      ? Math.max(0, Math.trunc(input.evidenceRefCount))
      : null;

  if (count !== null && count > 0) {
    return `${count} cited evidence reference${count === 1 ? "" : "s"}`;
  }

  const evidenceClass = nonEmpty(input.evidenceClass);

  if (evidenceClass !== null) {
    return `${evidenceClass} evidence`;
  }

  return null;
}

/** Builds one plain-language derivation sentence — never fabricates confidence when inputs are missing. */
export function buildFindingDerivationSentence(input: FindingDerivationInput): FindingDerivationResult {
  const reasoningSummary = nonEmpty(input.reasoningSummary);

  if (reasoningSummary !== null) {
    const sentence = firstRecommendationSentence(reasoningSummary);

    if (sentence.length > 0) {
      return { sentence, synthesised: false };
    }
  }

  const ruleLabel = resolveRuleLabel(input);
  const evidence = evidencePhrase(input);
  const severityLabel = nonEmpty(input.severityLabel);

  if (ruleLabel === null && evidence === null) {
    return { sentence: FINDING_DERIVATION_NOT_AVAILABLE, synthesised: false };
  }

  const severitySuffix =
    severityLabel !== null ? `a ${severityLabel} severity finding` : "this finding";

  if (ruleLabel !== null && evidence !== null) {
    return {
      sentence: `Policy rule "${ruleLabel}" matched ${evidence} and produced ${severitySuffix}.`,
      synthesised: true,
    };
  }

  if (ruleLabel !== null) {
    return {
      sentence: `Policy rule "${ruleLabel}" produced ${severitySuffix}.`,
      synthesised: true,
    };
  }

  if (evidence !== null) {
    return {
      sentence: `${evidence.charAt(0).toUpperCase()}${evidence.slice(1)} supported ${severitySuffix}.`,
      synthesised: true,
    };
  }

  return { sentence: FINDING_DERIVATION_NOT_AVAILABLE, synthesised: false };
}

export function parseFindingWireDerivationFields(wireJson: string): FindingWireDerivationFields {
  if (wireJson.trim().length === 0) {
    return {};
  }

  try {
    const parsed = JSON.parse(wireJson) as Record<string, unknown>;

    return {
      decisionRuleName: typeof parsed.decisionRuleName === "string" ? parsed.decisionRuleName : undefined,
      reasoningSummary: typeof parsed.reasoningSummary === "string" ? parsed.reasoningSummary : undefined,
      decisionRuleId: typeof parsed.decisionRuleId === "string" ? parsed.decisionRuleId : undefined,
    };
  } catch {
    return {};
  }
}

export function findingDerivationFromQuickDecisionFinding(finding: QuickDecisionFinding): FindingDerivationResult {
  const wire = parseFindingWireDerivationFields(finding.aiReasoning.wireJson);

  return buildFindingDerivationSentence({
    ruleName: wire.decisionRuleName,
    ruleId: finding.policyRuleId ?? wire.decisionRuleId,
    severityLabel: severityBadgeLabel(finding.severityValue),
    evidenceRefCount: finding.evidenceRefCount,
    evidenceClass: nonEmpty(finding.traceConfidenceLabel),
    reasoningSummary: wire.reasoningSummary,
  });
}

export function findingDerivationFromGovernanceQueueRow(
  row: GovernanceFindingQueueRow,
): FindingDerivationResult | null {
  if (row.recordKind !== "finding") {
    return null;
  }

  const policyRuleId = row.policyRuleId ?? coerceComplianceRuleKey(row.category);
  const categoryLabel =
    row.category.trim().length > 0 && row.category !== policyRuleId ? row.category : null;

  return buildFindingDerivationSentence({
    ruleId: policyRuleId,
    categoryLabel,
    severityLabel: row.severity,
    evidenceRefCount: row.evidenceRefCount,
    evidenceClass:
      row.traceConfidenceLevel !== null && row.traceConfidenceLevel !== undefined
        ? `${row.traceConfidenceLevel} confidence trace`
        : null,
  });
}
