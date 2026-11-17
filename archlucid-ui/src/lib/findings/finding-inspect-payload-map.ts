import type { components } from "@/lib/openapi-schemas";
import type { FindingInspectPayload } from "@/types/finding-inspect";

/** Maps inspect API wire JSON to the UI payload shape (camelCase normalization). */
export function mapFindingInspectApiPayload(raw: Record<string, unknown>): FindingInspectPayload {
  const optionalText = (value: unknown): string | null => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  };

  const requiredText = (value: unknown): string => optionalText(value) ?? "";
  const evidenceRaw = raw.evidence;
  const evidenceListReturned = Array.isArray(evidenceRaw);
  const evidence =
    evidenceListReturned
      ? evidenceRaw.map((item) => {
          const row = item as Record<string, unknown>;

          return {
            artifactId: optionalText(row.artifactId),
            lineRange: optionalText(row.lineRange),
            excerpt: optionalText(row.excerpt),
          };
        })
      : [];

  const recommendedActionsRaw = raw.recommendedActions;
  const recommendedActionsReturned = Array.isArray(recommendedActionsRaw);
  const recommendedActions = recommendedActionsReturned
    ? recommendedActionsRaw
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
    : [];

  return {
    findingId: requiredText(raw.findingId),
    typedPayload: raw.typedPayload ?? null,
    decisionRuleId: optionalText(raw.decisionRuleId),
    decisionRuleName: optionalText(raw.decisionRuleName),
    evidence,
    reasoningSummary: optionalText(raw.reasoningSummary),
    recommendedActions,
    recommendedActionsReturned,
    auditRowId: optionalText(raw.auditRowId),
    runId: requiredText(raw.runId),
    manifestVersion: optionalText(raw.manifestVersion),
    modelDeploymentName: optionalText(raw.modelDeploymentName),
    modelAlias: optionalText(raw.modelAlias),
    promptTemplateVersion: optionalText(raw.promptTemplateVersion),
    isMuted: typeof raw.isMuted === "boolean" ? raw.isMuted : undefined,
    muteReason: optionalText(raw.muteReason),
    reasoningTrace: optionalText(raw.reasoningTrace),
    evaluationConfidenceScore:
      typeof raw.evaluationConfidenceScore === "number"
      && Number.isFinite(raw.evaluationConfidenceScore)
      && raw.evaluationConfidenceScore >= 0
      && raw.evaluationConfidenceScore <= 100
        ? raw.evaluationConfidenceScore
        : null,
    confidenceLevel:
      raw.confidenceLevel === "Low" || raw.confidenceLevel === "Medium" || raw.confidenceLevel === "High"
        ? raw.confidenceLevel
        : null,
    humanReviewStatus:
      typeof raw.humanReviewStatus === "number" || typeof raw.humanReviewStatus === "string"
        ? (raw.humanReviewStatus as components["schemas"]["FindingHumanReviewStatus"])
        : undefined,
    assignedToUserId: optionalText(raw.assignedToUserId),
    remediationDueUtc: optionalText(raw.remediationDueUtc),
    trustLabel: optionalText(raw.trustLabel),
    trustLabelReason: optionalText(raw.trustLabelReason),
    evidenceListReturned,
  };
}
