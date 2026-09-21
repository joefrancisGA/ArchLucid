import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_RECORDED_TYPES_PREFIX,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_TOO_LARGE_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_TOO_LARGE_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import type { InfraEvidenceMermaidIdentityDiagramSuppressedArmType } from "@/lib/infra-evidence/infra-evidence-mermaid-types";
import {
  shouldShowInfraDiagramsDensityCoach,
  type InfraDiagramsDensityCoachInput,
} from "@/lib/infra-evidence/infra-evidence-diagrams-density-coach";

export type InfraDiagramsDensityCoachPresentation = {
  readonly title: string;
  readonly body: string;
  readonly variant: "too-large" | "empty-identity";
};

export type InfraDiagramsDensityCoachPresentationInput = InfraDiagramsDensityCoachInput & {
  readonly inventoryFilteredIdentityArmTypes: readonly InfraEvidenceMermaidIdentityDiagramSuppressedArmType[];
};

function isIdentityModeEmptyCoach(input: InfraDiagramsDensityCoachPresentationInput): boolean {
  return (
    input.selectedMode === "identity"
    && input.diagramContentEmpty
    && input.renderStatus === "Succeeded"
  );
}

function formatInventoryFilteredIdentityArmTypes(
  armTypes: readonly InfraEvidenceMermaidIdentityDiagramSuppressedArmType[],
): string {
  if (armTypes.length === 0) {
    return "";
  }

  const lines = armTypes.map(
    (entry) => `${entry.armResourceType} (${entry.resourceCount})`,
  );

  return `${GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_RECORDED_TYPES_PREFIX} ${lines.join(", ")}.`;
}

export function resolveInfraDiagramsDensityCoachPresentation(
  input: InfraDiagramsDensityCoachPresentationInput,
): InfraDiagramsDensityCoachPresentation | null {
  if (!shouldShowInfraDiagramsDensityCoach(input)) {
    return null;
  }

  if (isIdentityModeEmptyCoach(input)) {
    const retainedSummary = formatInventoryFilteredIdentityArmTypes(input.inventoryFilteredIdentityArmTypes);

    return {
      title: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_TITLE,
      body: retainedSummary.length > 0
        ? `${GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_BODY} ${retainedSummary}`
        : GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_BODY,
      variant: "empty-identity",
    };
  }

  return {
    title: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_TOO_LARGE_TITLE,
    body: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_TOO_LARGE_BODY,
    variant: "too-large",
  };
}
