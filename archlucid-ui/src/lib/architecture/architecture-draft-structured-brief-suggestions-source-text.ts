import type { ArchitectureDraftStructuredBriefState } from "@/lib/architecture/architecture-draft-structured-brief";
import {
  isConfirmedBriefEntry,
  parseQualityAttributeEntries,
} from "@/lib/architecture/architecture-draft-structured-brief";

type StructuredBriefSuggestionContext = Pick<
  ArchitectureDraftStructuredBriefState,
  | "confirmedConstraints"
  | "confirmedAssumptions"
  | "confirmedRequiredCapabilities"
  | "qualityAttribute"
>;

function appendListSection(sections: string[], title: string, items: readonly string[]): void {
  const confirmed = items.filter((item) => isConfirmedBriefEntry(item));

  if (confirmed.length === 0) {
    return;
  }

  sections.push(`${title}:\n${confirmed.map((item) => `- ${item}`).join("\n")}`);
}

/** Builds the free-text payload sent to POST /v1/architecture/request/draft. */
export function buildArchitectureDraftSuggestionSourceText(input: {
  readonly architectureOverview: string;
  readonly systemName?: string;
  readonly businessOutcome?: string;
  readonly structuredBrief?: StructuredBriefSuggestionContext;
}): string {
  const sections: string[] = [];
  const systemName = input.systemName?.trim() ?? "";
  const businessOutcome = input.businessOutcome?.trim() ?? "";
  const overview = input.architectureOverview.trim();

  if (systemName.length > 0) {
    sections.push(`System name: ${systemName}`);
  }

  if (businessOutcome.length > 0) {
    sections.push(`Business outcome: ${businessOutcome}`);
  }

  if (overview.length > 0) {
    sections.push(`Architecture overview:\n${overview}`);
  }

  if (input.structuredBrief !== undefined) {
    appendListSection(sections, "Confirmed constraints", input.structuredBrief.confirmedConstraints);
    appendListSection(sections, "Confirmed assumptions", input.structuredBrief.confirmedAssumptions);
    appendListSection(
      sections,
      "Confirmed required capabilities",
      input.structuredBrief.confirmedRequiredCapabilities,
    );

    const qualityAttributes = parseQualityAttributeEntries(input.structuredBrief.qualityAttribute).filter((item) =>
      isConfirmedBriefEntry(item),
    );

    if (qualityAttributes.length > 0) {
      sections.push(`Quality attributes:\n${qualityAttributes.map((item) => `- ${item}`).join("\n")}`);
    }
  }

  return sections.join("\n\n");
}
