import { ARCHITECTURE_DIAGRAM_NOT_OPERATOR_ASSERTED_SUFFIX } from "@/lib/architecture/architecture-diagram-copy";
import { parseArchitectureGeneratedContent } from "@/lib/architecture/architecture-generated-content-parser";
import type { ArchitectureGapAssertionFlags } from "@/lib/architecture/architecture-created-home-model";
import type { ArchitectureStructuredSection } from "@/lib/architecture/architecture-structured-content-types";

export type ArchitectureGapBaselinePersonEntry = {
  readonly label: string;
  readonly kind: string;
  readonly fromSubmittedParse?: boolean;
};

export type ArchitectureGapBaselineDerived = {
  readonly businessOutcome: string;
  readonly peopleAndSystems: readonly ArchitectureGapBaselinePersonEntry[];
  readonly keyIntegrations: readonly string[];
  readonly gapAssertion: ArchitectureGapAssertionFlags;
};

function sectionNarrativeText(section: ArchitectureStructuredSection | undefined): string {
  if (section === undefined) {
    return "";
  }

  const narrative = section.narrativeMarkdown?.trim() ?? "";

  if (narrative.length > 0) {
    return narrative;
  }

  return (section.entities ?? [])
    .map((entity) => entity.label.trim())
    .filter((label) => label.length > 0)
    .join(" ");
}

function entitiesAsPeopleAndSystems(
  section: ArchitectureStructuredSection | undefined,
  defaultKind: string,
): readonly ArchitectureGapBaselinePersonEntry[] {
  if (section === undefined) {
    return [];
  }

  return (section.entities ?? [])
    .map((entity) => ({
      label: entity.label.trim(),
      kind: defaultKind,
      fromSubmittedParse: true,
    }))
    .filter((entry) => entry.label.length > 0);
}

function integrationLabelsFromSection(section: ArchitectureStructuredSection | undefined): readonly string[] {
  if (section === undefined) {
    return [];
  }

  const narrative = section.narrativeMarkdown?.trim() ?? "";
  const entityLabels = (section.entities ?? [])
    .map((entity) => entity.label.trim())
    .filter((label) => label.length > 0);

  if (entityLabels.length > 0) {
    return entityLabels;
  }

  if (narrative.length === 0) {
    return [];
  }

  return narrative
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * Derives gap-check fields from server-persisted submitted architecture text so clarifications
 * stay consistent across browser sessions without relying on sessionStorage handoff alone.
 */
export function deriveArchitectureGapBaselineFromSubmittedText(
  submittedArchitectureText: string | null,
): ArchitectureGapBaselineDerived {
  const trimmed = submittedArchitectureText?.trim() ?? "";

  if (trimmed.length === 0) {
    return {
      businessOutcome: "",
      peopleAndSystems: [],
      keyIntegrations: [],
      gapAssertion: {
        businessOutcome: false,
        peopleAndSystems: false,
      },
    };
  }

  const parseResult = parseArchitectureGeneratedContent(trimmed, null);
  const businessOutcomeSection = parseResult.sections.find((section) => section.key === "business-outcome");
  const usersSection = parseResult.sections.find((section) => section.key === "users-and-stakeholders");
  const systemsSection = parseResult.sections.find((section) => section.key === "systems-and-services");
  const integrationsSection = parseResult.sections.find((section) => section.key === "external-integrations");
  const businessOutcome = sectionNarrativeText(businessOutcomeSection);
  const peopleAndSystems = [
    ...entitiesAsPeopleAndSystems(usersSection, "Human"),
    ...entitiesAsPeopleAndSystems(systemsSection, "Machine"),
  ];
  const keyIntegrations = integrationLabelsFromSection(integrationsSection);

  return {
    businessOutcome,
    peopleAndSystems,
    keyIntegrations,
    gapAssertion: {
      businessOutcome: false,
      peopleAndSystems: false,
    },
  };
}

export function formatParsedSubmittedArchitectureName(label: string): string {
  const trimmed = label.trim();

  if (trimmed.length === 0) {
    return trimmed;
  }

  return `${trimmed}${ARCHITECTURE_DIAGRAM_NOT_OPERATOR_ASSERTED_SUFFIX}`;
}
