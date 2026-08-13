import type { FindingInspectPayload } from "@/types/finding-inspect";

/** Maps inspect API wire JSON to the UI payload shape (camelCase normalization). */
export function mapFindingInspectApiPayload(raw: Record<string, unknown>): FindingInspectPayload {
  const evidenceRaw = raw.evidence;
  const evidence =
    Array.isArray(evidenceRaw)
      ? evidenceRaw.map((item) => {
          const row = item as Record<string, unknown>;

          return {
            artifactId: typeof row.artifactId === "string" ? row.artifactId : null,
            lineRange: typeof row.lineRange === "string" ? row.lineRange : null,
            excerpt: typeof row.excerpt === "string" ? row.excerpt : null,
          };
        })
      : [];

  const recommendedActionsRaw = raw.recommendedActions;
  const recommendedActions =
    Array.isArray(recommendedActionsRaw)
      ? recommendedActionsRaw.filter((value): value is string => typeof value === "string")
      : [];

  return {
    findingId: typeof raw.findingId === "string" ? raw.findingId : "",
    typedPayload: raw.typedPayload ?? null,
    decisionRuleId: typeof raw.decisionRuleId === "string" ? raw.decisionRuleId : null,
    decisionRuleName: typeof raw.decisionRuleName === "string" ? raw.decisionRuleName : null,
    evidence,
    reasoningSummary: typeof raw.reasoningSummary === "string" ? raw.reasoningSummary : null,
    recommendedActions,
    auditRowId: typeof raw.auditRowId === "string" ? raw.auditRowId : null,
    runId: typeof raw.runId === "string" ? raw.runId : "",
    manifestVersion: typeof raw.manifestVersion === "string" ? raw.manifestVersion : null,
    modelDeploymentName: typeof raw.modelDeploymentName === "string" ? raw.modelDeploymentName : null,
    modelAlias: typeof raw.modelAlias === "string" ? raw.modelAlias : null,
    promptTemplateVersion: typeof raw.promptTemplateVersion === "string" ? raw.promptTemplateVersion : null,
    isMuted: typeof raw.isMuted === "boolean" ? raw.isMuted : undefined,
    muteReason: typeof raw.muteReason === "string" ? raw.muteReason : null,
    reasoningTrace: typeof raw.reasoningTrace === "string" ? raw.reasoningTrace : null,
    evaluationConfidenceScore:
      typeof raw.evaluationConfidenceScore === "number" ? raw.evaluationConfidenceScore : null,
    confidenceLevel:
      raw.confidenceLevel === "Low" || raw.confidenceLevel === "Medium" || raw.confidenceLevel === "High"
        ? raw.confidenceLevel
        : null,
    humanReviewStatus: typeof raw.humanReviewStatus === "number" ? raw.humanReviewStatus : null,
    assignedToUserId: typeof raw.assignedToUserId === "string" ? raw.assignedToUserId : null,
    remediationDueUtc: typeof raw.remediationDueUtc === "string" ? raw.remediationDueUtc : null,
    trustLabel: typeof raw.trustLabel === "string" ? raw.trustLabel : null,
    trustLabelReason: typeof raw.trustLabelReason === "string" ? raw.trustLabelReason : null,
  };
}
