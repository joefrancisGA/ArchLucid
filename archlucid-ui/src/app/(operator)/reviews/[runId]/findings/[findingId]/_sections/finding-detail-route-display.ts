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
          return `Evidence linked to ${ruleLabel} — see evidence trail and manifest decision record.`;
        }

        return "Evidence linked in the finalized review package — see evidence trail and manifest decision record.";
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

  return "Validate that the related manifest decision, evidence citations, and remediation action are complete before approval.";
}

/** Buyer-polished fallback when inspect payload has not loaded yet. */
export function findingDetailLeadFallback(findingId: string): string {
  if (isPhiMinimizationFindingId(findingId) && isBuyerPolishedOperatorShellEnv()) {
    return "Residual risk record for the finalized Claims Intake review package.";
  }

  return "Review this finding independently from the parent package before approval.";
}
