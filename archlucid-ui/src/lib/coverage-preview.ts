import type { CoveragePreviewAssignment, CoveragePreviewResponse } from "@/lib/api/coverage-preview-api";

export type CoveragePreviewGroupKey =
  | "baseline"
  | "organizationRequired"
  | "platformOverlay"
  | "contextualRecommended"
  | "additionalOptional";

export const COVERAGE_PREVIEW_GROUP_LABELS: Record<CoveragePreviewGroupKey, string> = {
  baseline: "Architecture quality baseline",
  organizationRequired: "Required by your organization",
  platformOverlay: "Platform overlays",
  contextualRecommended: "Recommended for this architecture",
  additionalOptional: "Additional policy packs",
};

export function groupCoveragePreviewAssignments(
  assignments: readonly CoveragePreviewAssignment[],
): Record<CoveragePreviewGroupKey, CoveragePreviewAssignment[]> {
  const groups: Record<CoveragePreviewGroupKey, CoveragePreviewAssignment[]> = {
    baseline: [],
    organizationRequired: [],
    platformOverlay: [],
    contextualRecommended: [],
    additionalOptional: [],
  };

  for (const assignment of assignments) {
    switch (assignment.coverageType) {
      case "ProviderNeutralBaseline":
        groups.baseline.push(assignment);
        break;
      case "OrganizationRequired":
        groups.organizationRequired.push(assignment);
        break;
      case "PlatformOverlay":
        groups.platformOverlay.push(assignment);
        break;
      case "ContextualRecommended":
        groups.contextualRecommended.push(assignment);
        break;
      case "AdditionalOptional":
        groups.additionalOptional.push(assignment);
        break;
      default:
        break;
    }
  }

  return groups;
}

export function buildCoveragePreviewRequest(input: {
  cloudProvider: string;
  focusedPilotModeEnabled: boolean;
  securityIntakeAnswer?: string;
  descriptionText?: string;
  userOverrides?: ReadonlyArray<{
    policyPackId: string;
    excluded: boolean;
    exclusionReason: string;
  }>;
}): {
  cloudProvider: string;
  focusedPilotModeEnabled: boolean;
  securityIntakeAnswer?: string;
  descriptionText?: string;
  userOverrides?: Array<{
    policyPackId: string;
    excluded: boolean;
    exclusionReason: string;
  }>;
} {
  const securityIntakeAnswer = input.securityIntakeAnswer?.trim();
  const descriptionText = input.descriptionText?.trim();
  const userOverrides =
    input.userOverrides !== undefined && input.userOverrides.length > 0
      ? input.userOverrides
          .filter((override) => override.excluded)
          .map((override) => ({
            policyPackId: override.policyPackId,
            excluded: true,
            exclusionReason: override.exclusionReason.trim(),
          }))
      : undefined;

  return {
    cloudProvider: input.cloudProvider,
    focusedPilotModeEnabled: input.focusedPilotModeEnabled,
    ...(securityIntakeAnswer ? { securityIntakeAnswer } : {}),
    ...(descriptionText ? { descriptionText } : {}),
    ...(userOverrides !== undefined && userOverrides.length > 0 ? { userOverrides } : {}),
  };
}

export const COVERAGE_PREVIEW_CLOUD_NOT_STORED_MESSAGE =
  "Cloud was not stored, so this coverage preview was not evaluated." as const;

export const COVERAGE_PREVIEW_CLOUD_UNRECOGNIZED_MESSAGE =
  "Cloud target was not recognized, so this coverage preview was not evaluated." as const;

export const COVERAGE_PREVIEW_POLICY_PACK_VERSION_NOT_STORED_MESSAGE =
  "Policy pack version was not stored." as const;

export function formatCoveragePreviewPolicyPackVersion(policyPackVersion?: string | null): string {
  const trimmed = policyPackVersion?.trim() ?? "";

  if (trimmed.length === 0 || trimmed === COVERAGE_PREVIEW_POLICY_PACK_VERSION_NOT_STORED_MESSAGE) {
    return COVERAGE_PREVIEW_POLICY_PACK_VERSION_NOT_STORED_MESSAGE;
  }

  return trimmed;
}

export function resolveCoveragePreviewCloudHonesty(cloudProvider?: string): string | null {
  if (cloudProvider === undefined || cloudProvider.trim().length === 0) {
    return COVERAGE_PREVIEW_CLOUD_NOT_STORED_MESSAGE;
  }

  const normalized = cloudProvider.trim().toLowerCase();
  if (!["none", "azure", "aws", "gcp"].includes(normalized)) {
    return COVERAGE_PREVIEW_CLOUD_UNRECOGNIZED_MESSAGE;
  }

  return null;
}

export function mapNormalizedCloudProvider(normalized: string): string {
  switch (normalized.trim().toLowerCase()) {
    case "azure":
      return "Azure";
    case "aws":
      return "Aws";
    case "gcp":
      return "Gcp";
    default:
      return "None";
  }
}
export function formatCoveragePreviewScopeNote(response: CoveragePreviewResponse): string {
  if (response.focusedPilotModeEnabled) {
    return "Focused first review: baseline dimensions, organization-required packs, and selected platform overlays evaluate this run. Contextual recommendations apply when selected.";
  }

  return "Expanded review scope: every enabled standard for this workspace may contribute findings.";
}
