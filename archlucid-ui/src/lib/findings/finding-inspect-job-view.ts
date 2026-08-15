import {
  findingInspectNarrativeFields,
  findingInspectPrimaryLabels,
} from "@/lib/findings/finding-display-from-inspect";
import { coercePolicyRuleIdFromFindingWire } from "@/lib/findings/finding-policy-evidence-citations";
import { normalizeFindingEnforcementTier } from "@/lib/findings/finding-enforcement-tier";
import {
  classifyReviewFindingJobView,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import {
  coerceArchitectureFindingSeverity,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";
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

/** Maps inspect payload to the run-detail finding shape for job-view classification. */
export function mapInspectPayloadToQuickDecisionFinding(payload: FindingInspectPayload): QuickDecisionFinding {
  const narrative = findingInspectNarrativeFields(payload);
  const labels = findingInspectPrimaryLabels(payload);
  const typed = readTypedRecord(payload);
  const title = narrative.title ?? payload.findingId;
  const recommendation = labels.recommendedAction ?? narrative.description ?? "";
  const reasoningTrace = payload.reasoningTrace ?? payload.reasoningSummary ?? "";
  const enforcementTierRaw = typed?.enforcementTier ?? typed?.EnforcementTier;

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
    humanReviewStatus: payload.humanReviewStatus ?? null,
    assignedToUserId: payload.assignedToUserId ?? null,
  };
}

export function classifyInspectPayloadJobView(payload: FindingInspectPayload): FindingJobView {
  return classifyReviewFindingJobView(mapInspectPayloadToQuickDecisionFinding(payload));
}
