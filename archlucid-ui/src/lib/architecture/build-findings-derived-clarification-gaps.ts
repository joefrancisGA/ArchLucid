import { buildClarificationGapSourcePresentation } from "@/lib/architecture/architecture-clarification-gap-present";
import type { ArchitectureMissingItem } from "@/lib/architecture/architecture-created-home-model";
import { resolveClarificationFollowUpHref } from "@/lib/architecture/resolve-clarification-follow-up-href";
import type { ReviewClarificationQuestion } from "@/lib/review-clarification-questions-types";

export type BuildFindingsDerivedClarificationGapsInput = {
  readonly runId: string;
  readonly questions: readonly ReviewClarificationQuestion[];
  readonly clarificationPriorRunId: string | null;
  readonly gapSourceCapturedAtUtc: string | null;
};

export function buildFindingsDerivedClarificationGaps(
  input: BuildFindingsDerivedClarificationGapsInput,
): ArchitectureMissingItem[] {
  const source = buildClarificationGapSourcePresentation({
    capturedAtUtc: input.gapSourceCapturedAtUtc,
    fromHandoff: false,
    findingsDerived: true,
  });

  return input.questions.map((question) => ({
    id: question.questionId,
    label: question.prompt,
    href: resolveClarificationFollowUpHref({
      runId: input.runId,
      priorRunId: input.clarificationPriorRunId,
      questionId: question.questionId,
    }),
    category: "clarification" as const,
    source: {
      label: source.label,
      capturedAtLabel: source.capturedAtLabel,
    },
  }));
}
