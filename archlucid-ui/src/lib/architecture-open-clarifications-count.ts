import { parseArchitectureGeneratedContent } from "@/lib/architecture-generated-content-parser";
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture-structured-content-types";

export function countOpenClarifications(
  missingCount: number,
  openQuestionEntityCount: number,
): number {
  return missingCount + openQuestionEntityCount;
}

export function countOpenQuestionEntities(
  sourceText: string,
  userAssertions: ArchitectureCreationUserAssertions | null,
): number {
  const parseResult = parseArchitectureGeneratedContent(sourceText, userAssertions);
  const openQuestions = parseResult.sections.find((section) => section.key === "open-questions");

  return openQuestions?.entities.length ?? 0;
}
