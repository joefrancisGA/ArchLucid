import { coerceComplianceRuleKey } from "@/lib/policy/policy-pack-rule-key-prefix-catalog";
import {
  firstRecommendationSentence,
  severityBadgeLabel,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";
import { formatRecommendationFirstSentenceWithTruncationHonesty } from "@/lib/quick-decision-severity-labels";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

export const FINDING_DERIVATION_NOT_AVAILABLE = "Derivation not available";
export const FINDING_DERIVATION_NOT_STORED = "Derivation was not stored.";
export const FINDING_DERIVATION_STORED_EMPTY = "Derivation was stored empty.";
export const FINDING_DERIVATION_ASSEMBLED_PREFIX =
  "Assembled from stored rule and evidence fields, not a stored explanation.";
export const FINDING_DERIVATION_ASSEMBLED_RULE_ONLY_PREFIX =
  "Assembled from stored rule fields, not a stored explanation.";
export const FINDING_DERIVATION_EVIDENCE_REF_COUNT_NOT_STORED =
  "Evidence reference count was not stored." as const;

export type FindingDerivationInput = {
  readonly ruleName?: string | null;
  readonly ruleId?: string | null;
  readonly categoryLabel?: string | null;
  readonly severityLabel?: string | null;
  readonly evidenceRefCount?: number | null;
  readonly evidenceClass?: string | null;
  readonly traceConfidenceLabel?: string | null;
  readonly reasoningSummary?: string | null;
};

const TRACE_CONFIDENCE_NOT_ARTIFACT_SUFFIX = "This is not a cited evidence artifact.";

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

const SEVERITY_LABEL_NOT_STORED = "Severity label was not stored.";

function severityDerivationClause(severityLabel: string | null): string {
  if (severityLabel === null || severityLabel === SEVERITY_LABEL_NOT_STORED) {
    return "Severity was not stored.";
  }

  return `a ${severityLabel} severity finding`;
}

type ResolvedRulePhrase = {
  readonly text: string;
  readonly quotedName: boolean;
};

function resolveRulePhrase(input: FindingDerivationInput): ResolvedRulePhrase | null {
  const explicitName = nonEmpty(input.ruleName);

  if (explicitName !== null) {
    return { text: explicitName, quotedName: true };
  }

  const ruleId = nonEmpty(input.ruleId);

  if (ruleId !== null) {
    return { text: `Rule name was not stored. Rule id ${ruleId}`, quotedName: false };
  }

  return null;
}

function resolveCategoryOnlyLead(categoryLabel: string | null): string | null {
  if (categoryLabel === null) {
    return null;
  }

  return `Policy area ${categoryLabel}. Rule name was not stored.`;
}

function citedEvidenceRefCount(input: FindingDerivationInput): number | null {
  if (typeof input.evidenceRefCount !== "number" || !Number.isFinite(input.evidenceRefCount)) {
    return null;
  }

  return Math.max(0, Math.trunc(input.evidenceRefCount));
}

function evidencePhrase(input: FindingDerivationInput): string | null {
  const count = citedEvidenceRefCount(input);

  if (count === null) {
    return null;
  }

  if (count > 0) {
    return `${count} cited evidence reference${count === 1 ? "" : "s"}`;
  }

  return "No evidence references were stored.";
}

function traceConfidencePhrase(input: FindingDerivationInput): string | null {
  const traceConfidence = nonEmpty(input.traceConfidenceLabel);

  if (traceConfidence === null) {
    return null;
  }

  return `Trace confidence: ${traceConfidence}. ${TRACE_CONFIDENCE_NOT_ARTIFACT_SUFFIX}`;
}

function assembledSentence(sentence: string, hasPositiveEvidenceRefs: boolean): FindingDerivationResult {
  const prefix = hasPositiveEvidenceRefs
    ? FINDING_DERIVATION_ASSEMBLED_PREFIX
    : FINDING_DERIVATION_ASSEMBLED_RULE_ONLY_PREFIX;

  return {
    sentence: `${prefix} ${sentence}`,
    synthesised: true,
  };
}

/** Builds one plain-language derivation sentence — never fabricates confidence when inputs are missing. */
export function buildFindingDerivationSentence(input: FindingDerivationInput): FindingDerivationResult {
  if (input.reasoningSummary !== null && input.reasoningSummary !== undefined) {
    const trimmedReasoning = input.reasoningSummary.trim();

    if (trimmedReasoning.length === 0) {
      return { sentence: FINDING_DERIVATION_STORED_EMPTY, synthesised: false };
    }

    const sentence = formatRecommendationFirstSentenceWithTruncationHonesty(trimmedReasoning);

    if (sentence.length > 0) {
      return { sentence, synthesised: false };
    }

    return { sentence: FINDING_DERIVATION_STORED_EMPTY, synthesised: false };
  }

  const rulePhrase = resolveRulePhrase(input);
  const categoryLead = rulePhrase === null ? resolveCategoryOnlyLead(nonEmpty(input.categoryLabel)) : null;
  const evidenceRefCountKnown =
    typeof input.evidenceRefCount === "number" && Number.isFinite(input.evidenceRefCount);

  if (
    !evidenceRefCountKnown
    && (rulePhrase !== null || categoryLead !== null || traceConfidencePhrase(input) !== null)
  ) {
    return { sentence: FINDING_DERIVATION_EVIDENCE_REF_COUNT_NOT_STORED, synthesised: false };
  }

  const evidence = evidencePhrase(input);
  const traceConfidence = traceConfidencePhrase(input);
  const severityLabel = nonEmpty(input.severityLabel);
  const positiveEvidenceRefs = evidenceRefCountKnown && (citedEvidenceRefCount(input) ?? 0) > 0;

  if (rulePhrase === null && categoryLead === null && evidence === null && traceConfidence === null) {
    return { sentence: FINDING_DERIVATION_NOT_STORED, synthesised: false };
  }

  const severitySuffix = severityDerivationClause(severityLabel);

  const ruleLead =
    rulePhrase === null
      ? categoryLead
      : rulePhrase.quotedName
        ? `Policy rule "${rulePhrase.text}"`
        : rulePhrase.text;

  const evidenceParts = [evidence, traceConfidence].filter((part): part is string => part !== null);
  const evidenceLead =
    evidenceParts.length === 0
      ? null
      : evidenceParts.length === 1
        ? evidenceParts[0]
        : `${evidenceParts[0]} ${evidenceParts[1]}`;

  if (ruleLead !== null && evidenceLead !== null) {
    return assembledSentence(`${ruleLead} matched ${evidenceLead} and produced ${severitySuffix}.`, positiveEvidenceRefs);
  }

  if (ruleLead !== null) {
    return assembledSentence(`${ruleLead} produced ${severitySuffix}.`, positiveEvidenceRefs);
  }

  if (evidenceLead !== null) {
    return assembledSentence(
      `${evidenceLead.charAt(0).toUpperCase()}${evidenceLead.slice(1)} supported ${severitySuffix}.`,
      positiveEvidenceRefs,
    );
  }

  return { sentence: FINDING_DERIVATION_NOT_STORED, synthesised: false };
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
    traceConfidenceLabel: nonEmpty(finding.traceConfidenceLabel),
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
    traceConfidenceLabel: row.traceConfidenceLevel ?? null,
  });
}
