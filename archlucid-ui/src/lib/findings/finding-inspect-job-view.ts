import {
  findingInspectNarrativeFields,
  findingInspectPrimaryLabels,
} from "@/lib/findings/finding-display-from-inspect";
import { coercePolicyRuleIdFromFindingWire } from "@/lib/findings/finding-policy-evidence-citations";
import { normalizeFindingEnforcementTier } from "@/lib/findings/finding-enforcement-tier";
import {
  resolveFindingInspectExportClassification,
  type FindingInspectExportClassification,
} from "@/lib/findings/finding-inspect-export-classification";
import {
  FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
  FINDING_CLASSIFICATION_DECISION_GRADE,
} from "@/lib/findings/review-detail-findings-classification-band";
import { findingSemanticSupportBandFromTypedPayload } from "@/components/findings/FindingSemanticSupportBandInspectSection";
import {
  classifyReviewFindingJobView,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";

export type { FindingJobView };
import {
  coerceArchitectureFindingSeverity,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";
import { normalizeFindingHumanReviewStatus } from "@/lib/quick-decision-severity-labels";
import type { FindingInspectPayload } from "@/types/finding-inspect";

function readTypedRecord(payload: FindingInspectPayload): Record<string, unknown> | null {
  const typed = payload.typedPayload;

  if (typed === null || typeof typed !== "object" || Array.isArray(typed)) {
    return null;
  }

  return typed as Record<string, unknown>;
}

function severityValueFromInspectPayload(payload: FindingInspectPayload): number {
  const typed = readTypedRecord(payload);

  if (typed !== null) {
    const fromWire = typed.severity ?? typed.Severity;

    if (fromWire !== undefined) {
      return coerceArchitectureFindingSeverity(fromWire);
    }
  }

  const label = findingInspectPrimaryLabels(payload).severityLabel;

  if (label !== null && label.trim().length > 0) {
    return coerceArchitectureFindingSeverity(label);
  }

  return 0;
}

function wireJsonFromInspectPayload(payload: FindingInspectPayload): string {
  const typed = readTypedRecord(payload);

  if (typed === null) {
    return "{}";
  }

  try {
    return JSON.stringify(typed);
  } catch {
    return '{"error":"finding_typed_payload_not_json_serializable"}';
  }
}

function mapInspectExportClassification(
  classification: FindingInspectExportClassification,
): QuickDecisionFinding["classification"] {
  if (classification === FINDING_CLASSIFICATION_DECISION_GRADE) {
    return "DecisionGradeFinding";
  }

  if (classification === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE) {
    return "ChecklistCoverage";
  }

  return null;
}

/** Maps inspect payload to the run-detail finding shape for job-view classification. */
export function mapInspectPayloadToQuickDecisionFinding(payload: FindingInspectPayload): QuickDecisionFinding {
  const narrative = findingInspectNarrativeFields(payload);
  const labels = findingInspectPrimaryLabels(payload);
  const typed = readTypedRecord(payload);
  const title = narrative.title ?? payload.findingId;
  const recommendation = labels.recommendedAction ?? narrative.description ?? "";
  const reasoningTrace = payload.reasoningTrace ?? payload.reasoningSummary ?? "";
  const enforcementTierRaw = typed?.enforcementTier ?? typed?.EnforcementTier;
  const classification = mapInspectExportClassification(resolveFindingInspectExportClassification(payload));

  return {
    findingId: payload.findingId,
    title,
    recommendation,
    severityValue: severityValueFromInspectPayload(payload),
    findingOrder: 0,
    aiReasoning: {
      wireJson: wireJsonFromInspectPayload(payload),
      reasoningTrace,
    },
    isMuted: payload.isMuted === true,
    muteReason: payload.muteReason ?? null,
    confidenceLevel: payload.confidenceLevel ?? null,
    evaluationConfidenceScore:
      typeof payload.evaluationConfidenceScore === "number" ? payload.evaluationConfidenceScore : null,
    evidenceRefCount: payload.evidence?.length ?? null,
    enforcementTier: normalizeFindingEnforcementTier(enforcementTierRaw),
    policyRuleId: coercePolicyRuleIdFromFindingWire(typed) ?? payload.decisionRuleId,
    trustLabel: payload.trustLabel ?? null,
    trustLabelReason: payload.trustLabelReason ?? null,
    humanReviewStatus: normalizeFindingHumanReviewStatus(payload.humanReviewStatus),
    assignedToUserId: payload.assignedToUserId ?? null,
    classification,
    semanticSupportBand: findingSemanticSupportBandFromTypedPayload(typed, classification),
  };
}

export function classifyInspectPayloadJobView(payload: FindingInspectPayload): FindingJobView {
  return classifyReviewFindingJobView(mapInspectPayloadToQuickDecisionFinding(payload));
}
