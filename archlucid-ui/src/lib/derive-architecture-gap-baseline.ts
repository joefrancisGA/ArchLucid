import { parseArchitectureGeneratedContent } from "@/lib/architecture/architecture-generated-content-parser";
import type { ArchitectureGapAssertionFlags } from "@/lib/architecture/architecture-created-home-model";
import type { ArchitectureStructuredSection } from "@/lib/architecture/architecture-structured-content-types";

export type ArchitectureGapBaselineDerived = {
  readonly businessOutcome: string;
  readonly peopleAndSystems: readonly { readonly label: string; readonly kind: string }[];
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

  return section.entities
    .map((entity) => entity.label.trim())
    .filter((label) => label.length > 0)
    .join(" ");
}

function entitiesAsPeopleAndSystems(
  section: ArchitectureStructuredSection | undefined,
  defaultKind: string,
): readonly { readonly label: string; readonly kind: string }[] {
  if (section === undefined) {
    return [];
  }

  return section.entities
    .map((entity) => ({
      label: entity.label.trim(),
      kind: defaultKind,
    }))
    .filter((entry) => entry.label.length > 0);
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
  const businessOutcome = sectionNarrativeText(businessOutcomeSection);
  const peopleAndSystems = [
    ...entitiesAsPeopleAndSystems(usersSection, "Human"),
    ...entitiesAsPeopleAndSystems(systemsSection, "Machine"),
  ];

  return {
    businessOutcome,
    peopleAndSystems,
    gapAssertion: {
      businessOutcome: true,
      peopleAndSystems: true,
    },
  };
}
