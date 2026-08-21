"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createDraftRequest,
  patchDraftRequest,
  submitDraftRequest,
} from "@/lib/api/draft-intake-api";
import {
  emptyArchitectureDraftStructuredBrief,
  structuredBriefToPatchPayload,
} from "@/lib/architecture/architecture-draft-structured-brief";
import {
  formatOperatorAssertedClarificationAnswer,
  mergeStructuredBriefAssumptions,
} from "@/lib/architecture/clarification-answer-projection";
import { trackReviewPipelineInFlight } from "@/lib/operations/review-pipeline-in-flight";
import { buildReviewGenerationRedirect } from "@/lib/review-generation-handoff";
import { showError } from "@/lib/toast";
import type { ReviewClarificationQuestion } from "@/lib/review-clarification-questions-types";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ClarificationAnswerCapturePanelProps = {
  readonly runId: string;
  readonly questions: readonly ReviewClarificationQuestion[];
};

export function ClarificationAnswerCapturePanel(
  props: ClarificationAnswerCapturePanelProps,
): React.JSX.Element | null {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(
    () =>
      props.questions.length > 0 &&
      props.questions.every((question) => (answers[question.questionId]?.trim().length ?? 0) >= 8),
    [answers, props.questions],
  );

  if (props.questions.length === 0) {
    return null;
  }

  return (
    <section
      className="space-y-3 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="clarification-answer-capture-panel"
    >
      <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Answer clarifying questions
      </h3>
      <div className="space-y-3">
        {props.questions.map((question) => (
          <div key={question.questionId} className="space-y-1">
            <Label htmlFor={`clarification-answer-${question.questionId}`}>{question.prompt}</Label>
            <Textarea
              id={`clarification-answer-${question.questionId}`}
              data-testid={`clarification-answer-${question.questionId}`}
              rows={2}
              value={answers[question.questionId] ?? ""}
              disabled={busy}
              onChange={(event) => {
                setAnswers((current) => ({ ...current, [question.questionId]: event.target.value }));
              }}
            />
          </div>
        ))}
      </div>
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
                props.runId,
              );
              await patchDraftRequest(draft.draftId, {
                structuredBrief: structuredBriefToPatchPayload({
                  ...emptyArchitectureDraftStructuredBrief(),
                  confirmedAssumptions: mergeStructuredBriefAssumptions([], assumptionEntries),
                }),
              });
              const submitted = await submitDraftRequest(draft.draftId);
              trackReviewPipelineInFlight(submitted.runId);
              window.location.assign(buildReviewGenerationRedirect(submitted.runId));
            } catch (error) {
              showError(error instanceof Error ? error.message : "Could not submit clarifications.");
            } finally {
              setBusy(false);
            }
          })();
        }}
      >
        Start follow-up review
      </Button>
    </section>
  );
}
