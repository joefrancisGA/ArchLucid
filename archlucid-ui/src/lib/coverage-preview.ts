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
}): {
  cloudProvider: string;
  focusedPilotModeEnabled: boolean;
  securityIntakeAnswer?: string;
  descriptionText?: string;
} {
  const securityIntakeAnswer = input.securityIntakeAnswer?.trim();
  const descriptionText = input.descriptionText?.trim();

  return {
    cloudProvider: input.cloudProvider,
    focusedPilotModeEnabled: input.focusedPilotModeEnabled,
    ...(securityIntakeAnswer ? { securityIntakeAnswer } : {}),
    ...(descriptionText ? { descriptionText } : {}),
  };
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
export function formatCoveragePreviewScopeNote(response: CoveragePreviewResponse): string {
  if (response.focusedPilotModeEnabled) {
    return "Focused first review: baseline dimensions, organization-required packs, and selected platform overlays evaluate this run. Contextual recommendations apply when selected.";
  }

  return "Expanded review scope: every enabled standard for this workspace may contribute findings.";
}
