import { apiPostJson } from "@/lib/api";
import { ApiV1Routes } from "@/lib/api-v1-routes";

export type CoveragePreviewAssignment = {
  policyPackId: string;
  policyPackDisplayName: string;
  policyPackVersion: string;
  coverageType:
    | "ProviderNeutralBaseline"
    | "OrganizationRequired"
    | "PlatformOverlay"
    | "ContextualRecommended"
    | "AdditionalOptional";
  selectionState:
    | "AlwaysActive"
    | "RequiredAndLocked"
    | "RecommendedAndSelected"
    | "RecommendedButExcluded"
    | "OptionalAndSelected"
    | "OptionalAndNotSelected"
    | "NotApplicable"
    | "Retired";
  recommendationConfidence?: "High" | "Medium" | "Low" | null;
  recommendationTrigger?: string | null;
  recommendationRationale?: string | null;
  triggeringEvidenceRef?: string | null;
  qualityDimension?: string | null;
  includedInRunEvaluation: boolean;
  evaluationVersion: string;
};

export type CoveragePreviewResponse = {
  focusedPilotModeEnabled: boolean;
  summaryLine: string;
  providerNeutralBaselineCount: number;
  organizationRequiredCount: number;
  platformOverlayCount: number;
  contextualRecommendedCount: number;
  additionalOptionalCount: number;
  assignments: CoveragePreviewAssignment[];
};

export type CoveragePreviewRequest = {
  cloudProvider: string;
  focusedPilotModeEnabled: boolean;
  securityIntakeAnswer?: string;
  descriptionText?: string;
};

/** POST /v1/governance/coverage/preview — explainable assurance coverage before run creation. */
export async function postCoveragePreview(
  body: CoveragePreviewRequest,
): Promise<CoveragePreviewResponse> {
  return apiPostJson<CoveragePreviewResponse>(
    `/${ApiV1Routes.governance}/coverage/preview`,
    body,
  );
}
