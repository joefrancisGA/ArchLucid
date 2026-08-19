import type { ArchitectureMissingItem } from "@/lib/architecture/architecture-created-home-model";
import { parseArchitectureGeneratedContent } from "@/lib/architecture/architecture-generated-content-parser";
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture/architecture-structured-content-types";

export function countClarificationGaps(items: readonly ArchitectureMissingItem[]): number {
  return items.filter((item) => item.category === "clarification").length;
}

export function countOpenClarifications(
  clarificationGapCount: number,
  openQuestionEntityCount: number,
): number {
  return clarificationGapCount + openQuestionEntityCount;
}

export function countOpenQuestionEntities(
  sourceText: string,
  userAssertions: ArchitectureCreationUserAssertions | null,
): number {
  const parseResult = parseArchitectureGeneratedContent(sourceText, userAssertions);
  const openQuestions = parseResult.sections.find((section) => section.key === "open-questions");

  return openQuestions?.entities.length ?? 0;
}
