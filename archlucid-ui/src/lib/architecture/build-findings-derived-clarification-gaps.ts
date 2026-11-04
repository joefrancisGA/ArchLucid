import { buildClarificationGapSourcePresentation } from "@/lib/architecture/architecture-clarification-gap-present";
import type { ArchitectureMissingItem } from "@/lib/architecture/architecture-created-home-model";
import { resolveClarificationFollowUpHref, CLARIFICATION_FOLLOW_UP_REVIEW_ID_NOT_STORED } from "@/lib/architecture/resolve-clarification-follow-up-href";
import { formatClarificationGapQuestionPromptLabel } from "@/lib/reviews/review-clarification-questions-honesty";
import { formatReviewClarificationSourceFindingId } from "@/lib/review-clarification-questions-types";
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

    const promptLabel = formatClarificationGapQuestionPromptLabel(question.prompt);
    const sourceFindingIdTrimmed = question.sourceFindingId.trim();
    const sourceFindingLabel = formatReviewClarificationSourceFindingId(question.sourceFindingId);
    const label =
      sourceFindingIdTrimmed.length > 0
        ? promptLabel
        : `${promptLabel} ${sourceFindingLabel}`;

    return {
      id: question.questionId,
      label,
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
