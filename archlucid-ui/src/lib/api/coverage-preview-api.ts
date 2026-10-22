import { apiPostJson } from "@/lib/api";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { governanceScopeCoverageBlockedReason } from "@/lib/governance/governance-coverage-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

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

export type CoveragePreviewUserOverride = {
  policyPackId: string;
  excluded: boolean;
  exclusionReason?: string | null;
};

export type CoveragePreviewRequest = {
  cloudProvider: string;
  focusedPilotModeEnabled: boolean;
  securityIntakeAnswer?: string;
  descriptionText?: string;
  userOverrides?: readonly CoveragePreviewUserOverride[];
};

/** POST /v1/governance/coverage/preview — explainable assurance coverage before run creation. */
export async function postCoveragePreview(
  body: CoveragePreviewRequest,
): Promise<CoveragePreviewResponse> {
  try {
    return await apiPostJson<CoveragePreviewResponse>(
      `/${ApiV1Routes.governance}/coverage/preview`,
      body,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = governanceScopeCoverageBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
