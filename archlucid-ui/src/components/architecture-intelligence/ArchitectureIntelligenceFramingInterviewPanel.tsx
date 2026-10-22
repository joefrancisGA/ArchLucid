"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { Textarea } from "@/components/ui/textarea";
import { ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS } from "@/lib/api/architecture-request-draft-api";
import type { ArchitectureDraftStructuredBriefState } from "@/lib/architecture/architecture-draft-structured-brief";
import {
  ARCHITECTURE_FRAMING_SKIP_QUESTION_BUTTON,
  ARCHITECTURE_FRAMING_SKIPPED_STATUS_LABEL,
  ARCHITECTURE_FRAMING_SUGGEST_EMPTY_MESSAGE,
  ARCHITECTURE_FRAMING_SUGGEST_FROM_OVERVIEW_BUTTON,
  ARCHITECTURE_FRAMING_SUGGEST_SUCCESS_MESSAGE,
  type ArchitectureIntelligenceFramingQuestion,
} from "@/lib/architecture/architecture-intelligence-framing-interview";
import {
  countFramingSuggestionsApplied,
  suggestFramingAnswersFromOverview,
} from "@/lib/architecture/architecture-intelligence-framing-suggest";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureIntelligenceFramingInterviewPanelProps = {
  readonly questions: readonly ArchitectureIntelligenceFramingQuestion[];
  readonly answers: Readonly<Record<string, string>>;
  readonly skippedQuestionIds: ReadonlySet<string>;
  readonly busy: boolean;
  readonly canResubmit: boolean;
  readonly overviewSourceText: string;
  readonly businessOutcome?: string;
  readonly structuredBrief?: ArchitectureDraftStructuredBriefState;
  readonly disabled?: boolean;
  readonly testIdPrefix?: string;
  readonly onAnswerChange: (questionId: string, value: string) => void;
  readonly onSkippedQuestionIdsChange: (skippedQuestionIds: ReadonlySet<string>) => void;
  readonly onResubmit: () => void;
};

/** Inline framing interview for draft refine and other compact closed-loop surfaces. */
export function ArchitectureIntelligenceFramingInterviewPanel(
  props: ArchitectureIntelligenceFramingInterviewPanelProps,
) {
  const prefix = props.testIdPrefix ?? "architecture-intelligence-framing";
  const [suggestMessage, setSuggestMessage] = useState<string | null>(null);

  const overviewTrimmedLength = props.overviewSourceText.trim().length;
  const canSuggestFromOverview =
    overviewTrimmedLength >= ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS &&
    props.disabled !== true &&
    !props.busy;

  const handleSuggestFromOverview = useCallback(() => {
    if (!canSuggestFromOverview) {
      return;
    }

    const previousAnswers = props.answers;
    const suggestions = suggestFramingAnswersFromOverview(props.questions, {
      combinedSourceText: props.overviewSourceText,
      businessOutcome: props.businessOutcome,
      structuredBrief: props.structuredBrief,
    });

    const nextAnswers: Record<string, string> = { ...previousAnswers };

    for (const question of props.questions) {
      if (props.skippedQuestionIds.has(question.questionId)) {
        continue;
      }

      const current = nextAnswers[question.questionId]?.trim() ?? "";
      const suggested = suggestions[question.questionId]?.trim() ?? "";

      if (current.length === 0 && suggested.length > 0) {
        nextAnswers[question.questionId] = suggested;
      }
    }

    const appliedCount = countFramingSuggestionsApplied(props.questions, previousAnswers, nextAnswers);

    for (const [questionId, value] of Object.entries(nextAnswers)) {
      if (value !== (previousAnswers[questionId] ?? "")) {
        props.onAnswerChange(questionId, value);
      }
    }

    setSuggestMessage(
      appliedCount > 0
        ? ARCHITECTURE_FRAMING_SUGGEST_SUCCESS_MESSAGE(appliedCount)
        : ARCHITECTURE_FRAMING_SUGGEST_EMPTY_MESSAGE,
    );
  }, [
    canSuggestFromOverview,
    props.answers,
    props.businessOutcome,
    props.onAnswerChange,
    props.overviewSourceText,
    props.questions,
    props.skippedQuestionIds,
    props.structuredBrief,
  ]);

  const handleSkipQuestion = useCallback(
    (questionId: string) => {
      const nextSkipped = new Set(props.skippedQuestionIds);
      nextSkipped.add(questionId);
      props.onSkippedQuestionIdsChange(nextSkipped);
      setSuggestMessage(null);
    },
    [props],
  );

  const handleUnskipQuestion = useCallback(
    (questionId: string) => {
      const nextSkipped = new Set(props.skippedQuestionIds);
      nextSkipped.delete(questionId);
      props.onSkippedQuestionIdsChange(nextSkipped);
    },
    [props],
  );

  if (props.questions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid={`${prefix}-panel`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Framing questions
          </h3>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Answer open framing questions, skip any you do not need, then re-run refine.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canSuggestFromOverview}
          data-testid={`${prefix}-suggest-from-overview`}
          onClick={handleSuggestFromOverview}
        >
          {ARCHITECTURE_FRAMING_SUGGEST_FROM_OVERVIEW_BUTTON}
        </Button>
      </div>

      {suggestMessage !== null ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          role="status"
          data-testid={`${prefix}-suggest-message`}
        >
          {suggestMessage}
        </p>
      ) : null}

      <div className="space-y-3">
        {props.questions.map((question) => {
          const isSkipped = props.skippedQuestionIds.has(question.questionId);

          return (
            <div key={question.questionId} className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor={`${prefix}-${question.questionId}`}>{question.prompt}</Label>
                {isSkipped ? (
                  <StatusTag
                    kind="draft"
                    label={ARCHITECTURE_FRAMING_SKIPPED_STATUS_LABEL}
                    data-testid={`${prefix}-${question.questionId}-skipped-tag`}
                  />
                ) : null}
              </div>
              <Textarea
                id={`${prefix}-${question.questionId}`}
                data-testid={`${prefix}-${question.questionId}`}
                value={props.answers[question.questionId] ?? question.confirmedAnswer ?? ""}
                onChange={(event) => {
                  props.onAnswerChange(question.questionId, event.target.value);

                  if (props.skippedQuestionIds.has(question.questionId)) {
                    handleUnskipQuestion(question.questionId);
                  }
                }}
                rows={2}
                disabled={props.busy || isSkipped || props.disabled === true}
              />
              <div className="flex flex-wrap gap-2">
                {isSkipped ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={props.busy || props.disabled === true}
                    data-testid={`${prefix}-${question.questionId}-unskip`}
                    onClick={() => {
                      handleUnskipQuestion(question.questionId);
                    }}
                  >
                    Answer this question
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={props.busy || props.disabled === true}
                    data-testid={`${prefix}-${question.questionId}-skip`}
                    onClick={() => {
                      handleSkipQuestion(question.questionId);
                    }}
                  >
                    {ARCHITECTURE_FRAMING_SKIP_QUESTION_BUTTON}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        size="sm"
        disabled={props.busy || !props.canResubmit}
        data-testid={`${prefix}-resubmit`}
        onClick={props.onResubmit}
      >
        {props.busy ? "Re-running refine…" : "Re-run refine with answers"}
      </Button>
    </div>
  );
}
