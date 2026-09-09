import { typedPayloadLookupString } from "@/lib/findings/finding-display-from-inspect";
import { deriveFindingTrustLabelName } from "@/lib/findings/finding-provenance-display";
import type { FindingInspectPayload } from "@/types/finding-inspect";

export const DECISION_GRADE_CITATION_REQUIRED_EXPORT_BLOCKED_REASON =
  "Decision-grade findings require visible evidence citations before copy or external cite.";

function resolveInspectClassification(payload: FindingInspectPayload): string | null {
  const direct = typedPayloadLookupString(payload, "classification")
    ?? typedPayloadLookupString(payload, "findingClassification");

  if (direct !== null) {
    return direct;
  }

  return null;
}

function isDecisionGradeInspectFinding(payload: FindingInspectPayload): boolean {
  const classification = resolveInspectClassification(payload);

  return classification === "DecisionGradeFinding";
}

/** FC-39 — block copy/cite when decision-grade inspect has no visible citations (Working paths). */
export function resolveFindingInspectCitationExportBlockedReason(
  payload: FindingInspectPayload,
): string | null {
  if (!isDecisionGradeInspectFinding(payload)) {
    return null;
  }

  const evidenceCount = payload.evidence?.length ?? 0;

  if (evidenceCount > 0) {
    return null;
  }

  const trustLabel = deriveFindingTrustLabelName({
    trustLabel: payload.trustLabel ?? null,
    policyRuleId: payload.decisionRuleId,
    evidenceRefCount: evidenceCount,
  });

  if (trustLabel === "DeterministicRule" || trustLabel === "DeterministicFallback") {
    return null;
  }

  return DECISION_GRADE_CITATION_REQUIRED_EXPORT_BLOCKED_REASON;
}
