"use client";

import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { applyKnowledgeModelClarificationAnswers } from "@/lib/api/knowledge-model-clarification-api";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReviewClarificationQuestion } from "@/lib/review-clarification-questions-types";
import { showError, showSuccess } from "@/lib/toast";

const MIN_ANSWER_CHARS = 8;

export type ClarificationAnswerCapturePanelProps = {
  readonly runId: string;
  readonly priorRunId: string;
  readonly questions: readonly ReviewClarificationQuestion[];
  readonly freeTextIntent: string;
};

export function ClarificationAnswerCapturePanel(
  props: ClarificationAnswerCapturePanelProps,
): React.JSX.Element | null {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const allAnswersValid = useMemo(
    () =>
      props.questions.every((question) => (answers[question.questionId]?.trim().length ?? 0) >= MIN_ANSWER_CHARS),
    [answers, props.questions],
  );

  const updateAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }, []);

  const submitAnswers = useCallback(async () => {
    if (!allAnswersValid) {
      return;
    }

    setBusy(true);

    try {
      const result = await applyKnowledgeModelClarificationAnswers(props.runId, answers);
      const reReviewNote =
        result.reReviewTriggered
          ? ` Scoped re-review merged ${result.mergedFindingCount ?? 0} finding(s).`
          : "";
      showSuccess(
        `Applied ${result.appliedCount} clarification answer(s) to the architecture knowledge model.${reReviewNote}`,
      );
      window.location.reload();
    } catch (error) {
      showError("Clarification answers", error instanceof Error ? error.message : "Submit failed.");
    } finally {
      setBusy(false);
    }
  }, [allAnswersValid, answers, props.runId]);

  if (props.questions.length === 0) {
    return null;
  }

  return (
    <section
      className="space-y-4 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="clarification-answer-capture-panel"
    >
      <div className="space-y-1">
        <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Answer findings-derived clarifications
        </h3>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Answers update κ on this review and trigger a scoped re-review. Each answer needs at least {MIN_ANSWER_CHARS}{" "}
          characters.
        </p>
      </div>

      <ul className="m-0 list-none space-y-4 p-0">
        {props.questions.map((question) => {
          const answer = answers[question.questionId] ?? "";
          const answerId = `clarification-answer-${question.questionId}`;

          return (
            <li key={question.questionId} className="space-y-2">
              <Label htmlFor={answerId} className={OPERATOR_TYPOGRAPHY.body}>
                {question.prompt}
              </Label>
              <Textarea
                id={answerId}
                value={answer}
                onChange={(event) => {
                  updateAnswer(question.questionId, event.target.value);
                }}
                rows={3}
                disabled={busy}
              />
            </li>
          );
        })}
      </ul>

      <Button type="button" disabled={!allAnswersValid || busy} onClick={() => void submitAnswers()}>
        Apply answers and re-review
      </Button>
    </section>
  );
}
