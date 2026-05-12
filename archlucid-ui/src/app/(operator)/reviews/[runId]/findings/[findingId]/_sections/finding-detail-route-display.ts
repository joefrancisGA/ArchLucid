import {
  findingInspectPrimaryLabels,
  isPhiMinimizationFindingId,
  isPhiMinimizationSampleFinding,
  phiMinimizationApprovalNarrative,
  phiMinimizationControlNarrative,
} from "@/lib/finding-display-from-inspect";
import type { FindingInspectPayload } from "@/types/finding-inspect";

export function summarizeEvidenceBasis(payload: FindingInspectPayload | null): string {
  if (payload === null) {
    return "Evidence basis will appear after the finding payload loads.";
  }

  const evidenceCount = payload.evidence.length;

  if (evidenceCount === 0) {
    return "No explicit evidence citations are attached yet; reviewers should treat this as requiring evidence completion before closure.";
  }

  const citationLabel = evidenceCount === 1 ? "citation" : "citations";
  const ruleLabel = payload.decisionRuleName ?? payload.decisionRuleId;

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
      return status;
    }

    if (isPhiMinimizationSampleFinding(payload)) {
      return "Mitigated and monitored";
    }
  }

  if (isPhiMinimizationFindingId(findingId)) {
    return "Mitigated and monitored";
  }

  return "Requires review";
}

export function fallbackSeverity(payload: FindingInspectPayload | null, findingId: string): string {
  if (payload !== null) {
    const severity = findingInspectPrimaryLabels(payload).severityLabel;

    if (severity !== null && severity.trim().length > 0) {
      return severity;
    }

    if (isPhiMinimizationSampleFinding(payload)) {
      return "High severity";
    }
  }

  if (isPhiMinimizationFindingId(findingId)) {
    return "High severity";
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

  return "Review the recommended action and cited evidence before closing or escalating this finding.";
}

export function validationRequirement(payload: FindingInspectPayload | null, findingId: string): string {
  if (payload !== null && isPhiMinimizationSampleFinding(payload)) {
    return phiMinimizationApprovalNarrative();
  }

  if (isPhiMinimizationFindingId(findingId)) {
    return phiMinimizationApprovalNarrative();
  }

  return "Validate that the related manifest decision, evidence citations, and remediation action are complete before approval.";
}
