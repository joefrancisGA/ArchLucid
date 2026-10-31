import {
  findingInspectPrimaryLabels,
  typedPayloadLookupString,
  isPhiMinimizationFindingId,
  isPhiMinimizationSampleFinding,
  phiMinimizationRecommendedActionFallback,
} from "@/lib/findings/finding-display-from-inspect";
import { buyerFindingSeverityDisplayLabel } from "@/lib/buyer/buyer-finding-severity-display";
import { coerceArchitectureFindingSeverity, humanReviewStatusDisplay, normalizeFindingHumanReviewStatus, severityBadgeLabel } from "@/lib/quick-decision-severity-labels";
import { formatQuickDecisionRecommendedAction } from "@/lib/quick-decision-finding-links";
import { resolveProductionEvalChromeFromStorage } from "@/lib/resolve-production-eval-chrome-from-storage";
import type { FindingConfidenceLevel } from "@/types/explanation";
import type { FindingInspectPayload } from "@/types/finding-inspect";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export type FindingDecisionSummary = {
  readonly severity: string;
  readonly disposition: string;
  readonly businessImpact: string;
  readonly requiredMonitoring: string;
  readonly evidenceConfidenceLabel: string;
  readonly evidenceConfidenceLevel: FindingConfidenceLevel | null;
  readonly nextReview: string;
  readonly riskOwner: string;
};

const BUSINESS_IMPACT_STORED_EMPTY = "Business impact was stored empty.";
const REMEDIATION_DUE_NOT_STORED = "Remediation due date was not stored.";
const REMEDIATION_DUE_STORED_EMPTY = "Remediation due date was stored empty.";
const REMEDIATION_DUE_NOT_READABLE = "Remediation due date was not readable.";
const RISK_OWNER_NOT_ASSIGNED = "Risk owner was not stored";
const STATUS_NOT_STORED = "Status was not stored";
const SEVERITY_NOT_STORED = "Severity was not stored";
const BUSINESS_IMPACT_NOT_STORED = "Business impact was not stored";

export function deriveFindingDecisionSummary(
  payload: FindingInspectPayload | null,
  findingId: string,
): FindingDecisionSummary {
  const confidenceLevel = payload?.confidenceLevel ?? null;
  const evidenceConfidenceLabel =
    confidenceLevel === "High" || confidenceLevel === "Medium" || confidenceLevel === "Low"
      ? `${confidenceLevel} confidence`
      : "Confidence level was not stored";

  return {
    severity: fallbackSeverity(payload, findingId),
    disposition: fallbackStatus(payload, findingId),
    businessImpact: buyerFindingDecisionImpactCopy(payload, findingId),
    requiredMonitoring: mitigationPosture(payload, findingId),
    evidenceConfidenceLabel,
    evidenceConfidenceLevel: confidenceLevel,
    nextReview: resolveFindingNextReviewLabel(payload, findingId),
    riskOwner: resolveFindingRiskOwnerLabel(payload, findingId),
  };
}

/** Prefer payload assignee; PHI showcase may supply demo owner when payload has none. */
export function resolveFindingRiskOwnerLabel(
  payload: FindingInspectPayload | null,
  findingId: string,
): string {
  const assigned = payload?.assignedToUserId?.trim() ?? "";

  if (assigned.length > 0) {
    return `Risk owner name was not stored. Assignee id ${assigned}.`;
  }

  return RISK_OWNER_NOT_ASSIGNED;
}

/** Prefer stored remediation due date, including when the date is already past. */
export function resolveFindingNextReviewLabel(
  payload: FindingInspectPayload | null,
  _findingId: string,
): string {
  const dueLabel = formatFindingRemediationDueLabel(payload?.remediationDueUtc);

  if (dueLabel !== null) {
    return dueLabel;
  }

  return REMEDIATION_DUE_NOT_STORED;
}

export function formatFindingRemediationDueLabel(remediationDueUtc: string | null | undefined): string | null {
  if (remediationDueUtc === null || remediationDueUtc === undefined) {
    return null;
  }

  const trimmed = remediationDueUtc.trim();

  if (trimmed.length === 0) {
    return REMEDIATION_DUE_STORED_EMPTY;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return REMEDIATION_DUE_NOT_READABLE;
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }) + " UTC";
}

export function summarizeEvidenceBasis(payload: FindingInspectPayload | null): string {
  if (payload === null) {
    return "Finding detail has not loaded.";
  }

  if (payload.evidenceListReturned !== true) {
    return "Evidence list was not stored.";
  }

  const evidenceCount = payload.evidence.length;
  const ruleName = payload.decisionRuleName?.trim() ?? "";
  const ruleId = payload.decisionRuleId?.trim() ?? "";
  const citationLabel = evidenceCount === 1 ? "citation" : "citations";

  if (evidenceCount === 0) {
    return "0 evidence citations were stored.";
  }

  if (ruleName.length > 0) {
    return `${evidenceCount} evidence ${citationLabel} tied to ${ruleName}.`;
  }

  if (ruleId.length > 0) {
    return `${evidenceCount} evidence ${citationLabel}. Rule name was not stored. Rule id ${ruleId}.`;
  }

  return `${evidenceCount} evidence ${citationLabel}. Rule was not stored.`;
}

export function fallbackImpactedScope(payload: FindingInspectPayload | null, findingId: string): string {
  if (payload !== null) {
    const labels = findingInspectPrimaryLabels(payload);

    if (labels.impactedAreaLabel !== null && labels.impactedAreaLabel.trim().length > 0) {
      return labels.impactedAreaLabel;
    }

  }

  return "Impacted area was not stored.";
}

export function fallbackStatus(payload: FindingInspectPayload | null, findingId: string): string {
  if (payload !== null) {
    const status = findingInspectPrimaryLabels(payload).statusLabel;

    if (status !== null && status.trim().length > 0) {
      return status;
    }

    if (payload.humanReviewStatusStored === false) {
      return STATUS_NOT_STORED;
    }

    const reviewStatus = normalizeFindingHumanReviewStatus(payload.humanReviewStatus);

    if (reviewStatus !== null) {
      return humanReviewStatusDisplay(reviewStatus, { stored: payload.humanReviewStatusStored }).label;
    }
  }

  return STATUS_NOT_STORED;
}

export function fallbackSeverity(payload: FindingInspectPayload | null, findingId: string): string {
  if (payload !== null) {
    if (payload.severityStored === false) {
      return SEVERITY_NOT_STORED;
    }

    const wireSeverity = coerceArchitectureFindingSeverity(payload.severity);

    if (wireSeverity !== null) {
      if (resolveProductionEvalChromeFromStorage()) {
        return buyerFindingSeverityDisplayLabel(severityBadgeLabel(wireSeverity), payload.findingId ?? findingId);
      }

      return severityBadgeLabel(wireSeverity);
    }

    const severity = findingInspectPrimaryLabels(payload).severityLabel;

    if (resolveProductionEvalChromeFromStorage()) {
      return buyerFindingSeverityDisplayLabel(severity, payload.findingId ?? findingId);
    }

    if (severity !== null && severity.trim().length > 0) {
      return severity;
    }
  }

  return SEVERITY_NOT_STORED;
}

/**
 * Monitoring / recommended-action posture for decision summary.
 * PHI showcase may supply control narrative; never invent PHI copy for other findings.
 */
export function mitigationPosture(payload: FindingInspectPayload | null, findingId: string): string {
  if (payload !== null) {
    const action = findingInspectPrimaryLabels(payload).recommendedAction;

    if (action !== null) {
      return formatQuickDecisionRecommendedAction(action);
    }
  }

  return formatQuickDecisionRecommendedAction("");
}

/** Buyer decision panel — from payload/status, not a scripted default (BDA-012). */
export function buyerFindingDecisionPanelCopy(payload: FindingInspectPayload | null, findingId: string): string {
  if (payload !== null) {
    const status = findingInspectPrimaryLabels(payload).statusLabel;

    if (status !== null && status.trim().length > 0) {
      return `Disposition: ${status}.`;
    }
  }

  const status = fallbackStatus(payload, findingId);

  if (status === STATUS_NOT_STORED) {
    return "Disposition was not stored.";
  }

  return `Disposition: ${status}.`;
}

/** Top-of-page decision impact line for buyer-polished finding detail. */
function typedPayloadStoredEmptyString(payload: FindingInspectPayload, keys: readonly string[]): boolean {
  const value: unknown = payload.typedPayload;

  if (value === null || value === undefined || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  for (const key of keys) {
    if (!(key in record)) {
      continue;
    }

    const extracted = record[key];

    if (typeof extracted === "string" && extracted.trim().length === 0) {
      return true;
    }
  }

  return false;
}

export function buyerFindingDecisionImpactCopy(payload: FindingInspectPayload | null, findingId: string): string {
  if (payload !== null && typedPayloadStoredEmptyString(payload, ["businessImpact", "BusinessImpact", "impact", "Impact"])) {
    return BUSINESS_IMPACT_STORED_EMPTY;
  }

  const storedImpact =
    payload === null
      ? null
      : typedPayloadLookupString(payload, "businessImpact")
        ?? typedPayloadLookupString(payload, "BusinessImpact")
        ?? typedPayloadLookupString(payload, "impact")
        ?? typedPayloadLookupString(payload, "Impact");

  if (storedImpact !== null) {
    if (storedImpact.length === 0) {
      return BUSINESS_IMPACT_STORED_EMPTY;
    }

    return storedImpact;
  }

  const storedStatus = payload === null ? null : findingInspectPrimaryLabels(payload).statusLabel;

  if (storedStatus === null || storedStatus.trim().length === 0) {
    return BUSINESS_IMPACT_NOT_STORED;
  }

  return BUSINESS_IMPACT_NOT_STORED;
}

/** Top-of-page next step for buyer-polished finding detail. */
export function buyerFindingNextStepCopy(payload: FindingInspectPayload | null, findingId: string): string {
  if (payload !== null) {
    const action = findingInspectPrimaryLabels(payload).recommendedAction;

    if (action !== null && action.trim().length > 0) {
      return action;
    }
  }

  return mitigationPosture(payload, findingId);
}

export function validationRequirement(payload: FindingInspectPayload | null, _findingId: string): string {
  if (payload === null) {
    return "Audit record was not stored.";
  }

  const auditRowId = payload.auditRowId;

  if (auditRowId === null || auditRowId === undefined) {
    return "Audit record was not stored.";
  }

  if (auditRowId.trim().length === 0) {
    return "Audit record id was stored empty.";
  }

  return "Audit record id was stored.";
}

/** Buyer-polished fallback when inspect payload has not loaded yet. */
export function findingDetailLeadFallback(_findingId: string): string {
  return "Finding detail has not loaded.";
}

/** Map free-text finding status labels onto enterprise StatusTag kinds. */
export function findingStatusTagKind(statusLabel: string): EnterpriseStatusKind {
  const normalized = statusLabel.trim().toLowerCase();

  if (normalized.includes("monitoring")) {
    return "approved-with-monitoring";
  }

  if (normalized.includes("approved") || normalized.includes("accepted")) {
    return "approved";
  }

  if (normalized.includes("reject") || normalized.includes("block") || normalized.includes("fail")) {
    return "blocked";
  }

  if (
    normalized.includes("triage") ||
    normalized.includes("progress") ||
    normalized.includes("review") ||
    normalized.includes("open")
  ) {
    return "in-progress";
  }

  if (normalized.includes("draft")) {
    return "draft";
  }

  return "neutral";
}

/** Recommended-action paragraph: PHI showcase only; otherwise fail closed. */
export function findingRecommendedActionParagraph(
  payload: FindingInspectPayload,
  findingId: string,
): string {
  const labels = findingInspectPrimaryLabels(payload);
  const structured = labels.recommendedAction;

  if (structured !== null && structured !== undefined) {
    if (structured.trim().length > 0) {
      return formatQuickDecisionRecommendedAction(structured);
    }

    if (isPhiMinimizationSampleFinding(payload) || isPhiMinimizationFindingId(findingId)) {
      return phiMinimizationRecommendedActionFallback();
    }

    return formatQuickDecisionRecommendedAction(structured);
  }

  if (isPhiMinimizationSampleFinding(payload) || isPhiMinimizationFindingId(findingId)) {
    return phiMinimizationRecommendedActionFallback();
  }

  return formatQuickDecisionRecommendedAction("");
}
