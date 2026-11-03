import { buildClarificationGapSourcePresentation } from "@/lib/architecture/architecture-clarification-gap-present";
import type { ArchitectureMissingItem } from "@/lib/architecture/architecture-created-home-model";
import { resolveClarificationFollowUpHref, CLARIFICATION_FOLLOW_UP_REVIEW_ID_NOT_STORED } from "@/lib/architecture/resolve-clarification-follow-up-href";
import { formatClarificationGapQuestionPromptLabel } from "@/lib/reviews/review-clarification-questions-honesty";
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

  return input.questions.map((question) => {
    const followUpHref = resolveClarificationFollowUpHref({
      runId: input.runId,
      priorRunId: input.clarificationPriorRunId,
      questionId: question.questionId,
    });

    return {
      id: question.questionId,
      label: formatClarificationGapQuestionPromptLabel(question.prompt),
      href: followUpHref ?? "#",
      followUpUnavailableMessage:
        followUpHref === null ? CLARIFICATION_FOLLOW_UP_REVIEW_ID_NOT_STORED : null,
      category: "clarification" as const,
      source: {
        label: source.label,
        capturedAtLabel: source.capturedAtLabel,
      },
    };
  });
}
