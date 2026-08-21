import type {
  ArchitectureMissingItem,
  ClarificationGapSource,
} from "@/lib/architecture/architecture-created-home-model";
import type { ReviewClarificationQuestion } from "@/lib/review-clarification-questions-types";

export function buildFindingsDerivedClarificationGaps(input: {
  readonly runId: string;
  readonly questions: readonly ReviewClarificationQuestion[];
  readonly correctionHref: string;
  readonly source: ClarificationGapSource;
}): ArchitectureMissingItem[] {
  return input.questions.map((question) => ({
    id: question.questionId,
    label: question.prompt,
    href: input.correctionHref,
    category: "clarification" as const,
    source: {
      label: "From assessment findings",
      capturedAtLabel: input.source.capturedAtLabel,
    },
  }));
}
