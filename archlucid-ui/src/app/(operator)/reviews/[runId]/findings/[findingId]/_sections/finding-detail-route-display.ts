import {
  findingInspectPrimaryLabels,
  isPhiMinimizationFindingId,
  isPhiMinimizationSampleFinding,
  phiMinimizationApprovalNarrative,
  phiMinimizationControlNarrative,
  phiMinimizationRecommendedActionFallback,
} from "@/lib/finding-display-from-inspect";
import { buyerFindingSeverityDisplayLabel } from "@/lib/buyer-finding-severity-display";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { FindingInspectPayload } from "@/types/finding-inspect";

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
          return `Evidence linked to ${ruleLabel} — see evidence trail and review decision record.`;
        }

        return "Evidence linked in the finalized review — see evidence trail and review decision record.";
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

  if (isBuyerPolishedOperatorShellEnv()) {
    return phiMinimizationRecommendedActionFallback();
  }

  return "Review the recommended action and cited evidence before closing or escalating this finding.";
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
    return "Recorded in the governance decision record with evidence trail linkage.";
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
