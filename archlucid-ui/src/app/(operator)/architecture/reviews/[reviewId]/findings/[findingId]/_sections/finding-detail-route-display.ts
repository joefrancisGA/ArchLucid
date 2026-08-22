import {
  findingInspectPrimaryLabels,
  isPhiMinimizationFindingId,
  isPhiMinimizationSampleFinding,
  phiMinimizationApprovalNarrative,
  phiMinimizationControlNarrative,
  phiMinimizationRecommendedActionFallback,
} from "@/lib/findings/finding-display-from-inspect";
import {
  resolveBuyerShowcaseResidualRiskNextReviewIso,
  BUYER_SHOWCASE_RESIDUAL_RISK_OWNER,
} from "@/lib/buyer/buyer-polish-copy";
import { buyerFindingSeverityDisplayLabel } from "@/lib/buyer/buyer-finding-severity-display";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
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

const NO_RECOMMENDED_ACTION_RECORDED = "No recommended action recorded for this finding.";
const NO_REMEDIATION_DUE_RECORDED = "No remediation due date recorded";
const RISK_OWNER_NOT_ASSIGNED = "Not assigned";

export function deriveFindingDecisionSummary(
  payload: FindingInspectPayload | null,
  findingId: string,
): FindingDecisionSummary {
  const confidenceLevel = payload?.confidenceLevel ?? null;
  const evidenceConfidenceLabel =
    confidenceLevel === "High" || confidenceLevel === "Medium" || confidenceLevel === "Low"
      ? `${confidenceLevel} confidence`
      : summarizeEvidenceBasis(payload);

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
    return assigned;
  }

  if (isPhiMinimizationFindingId(findingId) || (payload !== null && isPhiMinimizationSampleFinding(payload))) {
    return BUYER_SHOWCASE_RESIDUAL_RISK_OWNER;
  }

  return RISK_OWNER_NOT_ASSIGNED;
}

function isShowcasePhiMinimizationFinding(
  payload: FindingInspectPayload | null,
  findingId: string,
): boolean {
  return isPhiMinimizationFindingId(findingId) || (payload !== null && isPhiMinimizationSampleFinding(payload));
}

function isPastRemediationDueUtc(remediationDueUtc: string | null | undefined): boolean {
  if (remediationDueUtc === null || remediationDueUtc === undefined) {
    return false;
  }

  const trimmed = remediationDueUtc.trim();

  if (trimmed.length === 0) {
    return false;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const todayUtc = new Date();

  todayUtc.setUTCHours(0, 0, 0, 0);
  parsed.setUTCHours(0, 0, 0, 0);

  return parsed.getTime() < todayUtc.getTime();
}

/** Prefer remediation due date; PHI showcase may supply demo cadence when payload has none. */
export function resolveFindingNextReviewLabel(
  payload: FindingInspectPayload | null,
  findingId: string,
): string {
  const showcasePhi = isShowcasePhiMinimizationFinding(payload, findingId);
  const dueLabel = formatFindingRemediationDueLabel(payload?.remediationDueUtc);

  if (dueLabel !== null) {
    if (showcasePhi && isPastRemediationDueUtc(payload?.remediationDueUtc)) {
      return resolveBuyerShowcaseResidualRiskNextReviewIso();
    }

    return dueLabel;
  }

  if (showcasePhi) {
    return resolveBuyerShowcaseResidualRiskNextReviewIso();
  }

  return NO_REMEDIATION_DUE_RECORDED;
}

export function formatFindingRemediationDueLabel(remediationDueUtc: string | null | undefined): string | null {
  if (remediationDueUtc === null || remediationDueUtc === undefined) {
    return null;
  }

  const trimmed = remediationDueUtc.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function summarizeEvidenceBasis(payload: FindingInspectPayload | null): string {
  if (payload === null) {
    return "Evidence basis will appear after the finding payload loads.";
  }

  const evidenceCount = payload.evidence.length;
  const ruleLabel = payload.decisionRuleName ?? payload.decisionRuleId;
  const citationLabel = evidenceCount === 1 ? "citation" : "citations";

  if (evidenceCount === 0) {
    if (isPhiMinimizationSampleFinding(payload) || isPhiMinimizationFindingId(payload.findingId)) {
      if (isBuyerPolishedOperatorShellEnv()) {
        if (ruleLabel !== null && ruleLabel.trim().length > 0) {
          return `Evidence linked to ${ruleLabel} — see evidence trail and finalized review record.`;
        }

        return "Evidence linked in the finalized review — see evidence trail and finalized review record.";
      }
    }

    return "No explicit evidence citations are attached yet; reviewers should treat this as requiring evidence completion before closure.";
  }

  if (ruleLabel !== null && ruleLabel.trim().length > 0) {
    return `${evidenceCount} evidence ${citationLabel} tied to ${ruleLabel}.`;
  }

  return `${evidenceCount} evidence ${citationLabel} tied to the persisted finding record.`;
}

export function fallbackImpactedScope(payload: FindingInspectPayload | null, findingId: string): string {
  if (payload !== null) {
    const labels = findingInspectPrimaryLabels(payload);

    if (labels.impactedAreaLabel !== null && labels.impactedAreaLabel.trim().length > 0) {
      return labels.impactedAreaLabel;
    }

    if (isPhiMinimizationSampleFinding(payload)) {
      return "Intake PHI boundary, adapters, OCR exception paths, and downstream adjudication handoff";
    }
  }

  if (isPhiMinimizationFindingId(findingId)) {
    return "Intake PHI boundary, adapters, OCR exception paths, and downstream adjudication handoff";
  }

  return "Architecture boundary and approval criteria for this finding";
}

export function fallbackStatus(payload: FindingInspectPayload | null, findingId: string): string {
  if (payload !== null) {
    const status = findingInspectPrimaryLabels(payload).statusLabel;

    if (status !== null && status.trim().length > 0) {
      if (isBuyerPolishedOperatorShellEnv() && status.toLowerCase() === "triaged") {
        return "Accepted with monitoring";
      }

      return status;
    }

    if (isPhiMinimizationSampleFinding(payload)) {
      return "Accepted with monitoring";
    }
  }

  if (isPhiMinimizationFindingId(findingId)) {
    return "Accepted with monitoring";
  }

  return "Requires review";
}

export function fallbackSeverity(payload: FindingInspectPayload | null, findingId: string): string {
  if (payload !== null) {
    const severity = findingInspectPrimaryLabels(payload).severityLabel;

    if (isBuyerPolishedOperatorShellEnv()) {
      return buyerFindingSeverityDisplayLabel(severity, payload.findingId ?? findingId);
    }

    if (severity !== null && severity.trim().length > 0) {
      return severity;
    }

    if (isPhiMinimizationSampleFinding(payload)) {
      return "High";
    }
  }

  if (isPhiMinimizationFindingId(findingId)) {
    return isBuyerPolishedOperatorShellEnv() ? "High" : "High severity";
  }

  return "Severity pending";
}

/**
 * Monitoring / recommended-action posture for decision summary.
 * PHI showcase may supply control narrative; never invent PHI copy for other findings.
 */
export function mitigationPosture(payload: FindingInspectPayload | null, findingId: string): string {
  if (payload !== null) {
    const action = findingInspectPrimaryLabels(payload).recommendedAction;

    if (action !== null && action.trim().length > 0) {
      return action;
    }

    if (isPhiMinimizationSampleFinding(payload)) {
      return phiMinimizationControlNarrative();
    }
  }

  if (isPhiMinimizationFindingId(findingId)) {
    return phiMinimizationControlNarrative();
  }

  return NO_RECOMMENDED_ACTION_RECORDED;
}

/** Buyer decision panel — from payload/status, not a scripted default (BDA-012). */
export function buyerFindingDecisionPanelCopy(payload: FindingInspectPayload | null, findingId: string): string {
  if (payload !== null) {
    const status = findingInspectPrimaryLabels(payload).statusLabel;

    if (status !== null && status.trim().length > 0) {
      return `Disposition: ${status}. See acceptance record below for recorded controls.`;
    }
  }

  const status = fallbackStatus(payload, findingId);

  if (status !== "Requires review") {
    return `Disposition: ${status}. See acceptance record below for recorded controls.`;
  }

  return "No disposition recorded for this finding.";
}

/** Top-of-page decision impact line for buyer-polished finding detail. */
export function buyerFindingDecisionImpactCopy(payload: FindingInspectPayload | null, findingId: string): string {
  if (payload !== null && isPhiMinimizationSampleFinding(payload)) {
    return "Non-blocking for package approval — residual PHI minimization risk accepted with ingress classification, bounded adapters, and active exception monitoring.";
  }

  if (isPhiMinimizationFindingId(findingId)) {
    return "Non-blocking for package approval — residual PHI minimization risk accepted with ingress classification, bounded adapters, and active exception monitoring.";
  }

  const status = fallbackStatus(payload, findingId);

  if (status === "Requires review") {
    return "Resolve cited evidence gaps before governance sign-off on the review.";
  }

  return buyerFindingDecisionPanelCopy(payload, findingId);
}

/** Top-of-page next step for buyer-polished finding detail. */
export function buyerFindingNextStepCopy(payload: FindingInspectPayload | null, findingId: string): string {
  return mitigationPosture(payload, findingId);
}

export function validationRequirement(payload: FindingInspectPayload | null, findingId: string): string {
  if (payload !== null && isPhiMinimizationSampleFinding(payload)) {
    return phiMinimizationApprovalNarrative();
  }

  if (isPhiMinimizationFindingId(findingId)) {
    return phiMinimizationApprovalNarrative();
  }

  if (isBuyerPolishedOperatorShellEnv()) {
    return "Recorded in the approval workflow with evidence trail linkage.";
  }

  return "Validate that the related review decision, evidence citations, and remediation action are complete before approval.";
}

/** Buyer-polished fallback when inspect payload has not loaded yet. */
export function findingDetailLeadFallback(findingId: string): string {
  if (isPhiMinimizationFindingId(findingId) && isBuyerPolishedOperatorShellEnv()) {
    return "Residual risk record for the finalized Claims Intake review.";
  }

  return "Review this finding independently from the parent review before approval.";
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
  const structured = labels.recommendedAction?.trim() ?? "";

  if (structured.length > 0) {
    return structured;
  }

  if (isPhiMinimizationSampleFinding(payload) || isPhiMinimizationFindingId(findingId)) {
    return phiMinimizationRecommendedActionFallback();
  }

  return NO_RECOMMENDED_ACTION_RECORDED;
}
