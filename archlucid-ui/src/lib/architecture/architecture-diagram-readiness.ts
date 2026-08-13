import { ARCHITECTURE_DIAGRAM_MISSING_CATEGORY_LABELS } from "@/lib/architecture/architecture-diagram-copy";
import type { ArchitectureStructuredParseResult, ArchitectureStructuredSection } from "@/lib/architecture/architecture-structured-content-types";
import type {
  ArchitectureDiagramMissingCategory,
  ArchitectureDiagramReadiness,
} from "@/lib/architecture/architecture-diagram-types";

const MIN_ACTIVE_NODES = 2;

function sectionEntities(section: ArchitectureStructuredSection | undefined): readonly { readonly label: string }[] {
  return section?.entities ?? [];
}

function sectionHasContent(section: ArchitectureStructuredSection | undefined): boolean {
  if (section === undefined) {
    return false;
  }

  return (section.narrativeMarkdown?.trim().length ?? 0) > 0 || section.entities.length > 0;
}

export function assessArchitectureDiagramReadiness(
  parseResult: ArchitectureStructuredParseResult,
  architectureName: string,
): ArchitectureDiagramReadiness {
  const byKey = new Map(parseResult.sections.map((section) => [section.key, section]));
  const systems = sectionEntities(byKey.get("systems-and-services"));
  const users = sectionEntities(byKey.get("users-and-stakeholders"));
  const external = sectionEntities(byKey.get("external-integrations"));
  const hasNamedSystem = architectureName.trim().length > 0 && architectureName.trim().toLowerCase() !== "untitled architecture";
  const activeNodeCount = systems.length + users.length + external.length + (hasNamedSystem ? 1 : 0);
  const missingCategories: ArchitectureDiagramMissingCategory[] = [];

  if (systems.length === 0 && !hasNamedSystem) {
    missingCategories.push("major-components");
  }

  if (external.length === 0) {
    missingCategories.push("external-systems");
  }

  if (users.length === 0) {
    missingCategories.push("users-or-initiators");
  }

  if (external.length === 0 && !sectionHasContent(byKey.get("data-flows"))) {
    missingCategories.push("integrations");
  }

  if (!sectionHasContent(byKey.get("data-flows"))) {
    missingCategories.push("data-flows");
  }

  if (!sectionHasContent(byKey.get("trust-boundaries"))) {
    missingCategories.push("trust-boundaries");
  }

  const hasMajorComponent = systems.length > 0 || hasNamedSystem;
  const sufficient = activeNodeCount >= MIN_ACTIVE_NODES && hasMajorComponent;

  return {
    sufficient,
    missingCategories,
    activeNodeCount,
  };
}

export function formatArchitectureDiagramMissingExplanation(
  missingCategories: readonly ArchitectureDiagramMissingCategory[],
): string {
  if (missingCategories.length === 0) {
    return "Add more architecture detail to generate a diagram.";
  }

  const labels = missingCategories.map((category) => ARCHITECTURE_DIAGRAM_MISSING_CATEGORY_LABELS[category]);

  return `Still needed: ${labels.join(", ")}.`;
}
