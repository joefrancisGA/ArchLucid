"use client";

import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  admitDraftRequest,
  createDraftRequest,
  patchDraftRequest,
  submitDraftRequest,
} from "@/lib/api/draft-intake-api";
import { architectureCreationDefaultActorSet } from "@/lib/architecture/architecture-creation-init";
import { structuredBriefToPatchPayload } from "@/lib/architecture/architecture-draft-structured-brief";
import { projectClarificationAnswersToConfirmedAssumptions } from "@/lib/architecture/clarification-answer-projection";
import { buildReviewGenerationRedirect } from "@/lib/review-generation-handoff";
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
      const created = await createDraftRequest(props.freeTextIntent, "start-review", props.priorRunId);
      const confirmedAssumptions = projectClarificationAnswersToConfirmedAssumptions(answers);

      await patchDraftRequest(created.draftId, {
        freeTextIntent: props.freeTextIntent,
        actorSet: architectureCreationDefaultActorSet(),
        workflowIntent: "start-review",
        structuredBrief: structuredBriefToPatchPayload({
          confirmedConstraints: [],
          confirmedAssumptions,
          confirmedRequiredCapabilities: [],
          suggestedConstraints: [],
          suggestedAssumptions: [],
          suggestedRequiredCapabilities: [],
          qualityAttribute: "",
          failureModeNote: "",
          operationalOwner: "",
        }),
      });

      await admitDraftRequest(created.draftId);
      const submitted = await submitDraftRequest(created.draftId);
      showSuccess("Clarification answers submitted for the next review run.");
      window.location.assign(buildReviewGenerationRedirect(submitted.runId, "socratic-intake"));
    } catch (error) {
      showError("Clarification answers", error instanceof Error ? error.message : "Submit failed.");
    } finally {
      setBusy(false);
    }
  }, [allAnswersValid, answers, props.freeTextIntent, props.priorRunId]);

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
          Capture inline answers here to start a clarification round. Each answer needs at least {MIN_ANSWER_CHARS}{" "}
          characters.
        </p>
      </div>
<<<<<<< HEAD

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
        Submit clarification round
=======
      <Button
        type="button"
        variant="primary"
        size="sm"
        disabled={!canSubmit || busy}
        data-testid="clarification-answer-submit"
        onClick={() => {
          void (async () => {
            setBusy(true);
            try {
              const answeredAtUtc = new Date().toISOString();
              const assumptionEntries = props.questions.map((question) =>
                formatOperatorAssertedClarificationAnswer({
                  questionId: question.questionId,
                  priorRunId: props.runId,
                  answeredAtUtc,
                  answer: answers[question.questionId]?.trim() ?? "",
                }),
              );
              const draft = await createDraftRequest(
                `Follow-up clarifications for review ${props.runId}`,
                "start-review",
              );
              await patchDraftRequest(draft.draftId, {
                structuredBrief: structuredBriefToPatchPayload({
                  ...emptyArchitectureDraftStructuredBrief(),
                  confirmedAssumptions: mergeStructuredBriefAssumptions([], assumptionEntries),
                }),
              });
              const submitted = await submitDraftRequest(draft.draftId);
              trackReviewPipelineInFlight(submitted.runId);
              window.location.assign(buildReviewGenerationRedirect(submitted.runId, "socratic-intake"));
            } catch (error) {
              showError(error instanceof Error ? error.message : "Could not submit clarifications.");
            } finally {
              setBusy(false);
            }
          })();
        }}
      >
        Start follow-up review
>>>>>>> origin/master
      </Button>
    </section>
  );
}
