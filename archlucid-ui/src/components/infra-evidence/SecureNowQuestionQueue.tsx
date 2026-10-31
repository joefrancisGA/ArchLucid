"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { secureNowQuestionAnswerLabel } from "@/lib/infra-evidence/securenow-question-answer-label";
import {
  secureNowQuestionDispositionMutationResourceId,
  secureNowQuestionIsPolicyPackDispositionRow,
  secureNowQuestionPackAnswerChoiceLabel,
  secureNowQuestionReviewerEvidenceFingerprintLine,
  secureNowQuestionReviewerScopeLabel,
  secureNowQuestionReviewerSourceLabel,
  secureNowQuestionReviewerSubscriptionLabel,
} from "@/lib/infra-evidence/securenow-question-mutation-resource-id";
import {
  secureNowQuestionDispositionReviewerStatusLabel,
  secureNowQuestionDispositionShowsAnswerActions,
  secureNowQuestionDispositionShowsStoredAnswerMetadata,
  secureNowQuestionReviewerClosedAnswerCodeLine,
  secureNowQuestionReviewerClosedAnswerTextLine,
  secureNowQuestionReviewerClosedDispositionReasonLine,
  secureNowQuestionReviewerReasonTextLine,
  secureNowQuestionReviewerSourceLine,
  SECURENOW_QUESTION_DISPOSITION_STATUS_NOT_STORED_FILTER,
} from "@/lib/infra-evidence/securenow-question-disposition-status";
import {
  secureNowQuestionReviewerExpirationDisplayLine,
  secureNowQuestionReviewerExpirationUtcStamp,
} from "@/lib/infra-evidence/securenow-question-expiration";
import type { SecureNowQuestion } from "@/lib/infra-evidence/securenow-question-queue-api";
import {
  secureNowQuestionResourceDisplayName,
  secureNowQuestionResourceTypeLabel,
} from "@/lib/infra-evidence/securenow-question-resource-identity-display";
import { secureNowQuestionShowsExpired } from "@/lib/infra-evidence/securenow-question-expiration";
import { diagramOutlineIncludesFocusResource } from "@/lib/architecture/architecture-diagram-camera-focus";
import type { InfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import {
  SecureNowQuestionQueueProvider,
  useSecureNowQuestionQueue,
  VISIT_CAP,
  type SecureNowQuestionQueueProviderProps,
} from "@/components/infra-evidence/securenow-question-queue-provider";

export {
  SecureNowQuestionQueueProvider,
  useSecureNowQuestionQueue,
  useSecureNowQuestionSubjectNodeId,
} from "@/components/infra-evidence/securenow-question-queue-provider";

type SecureNowQuestionQueueProps = SecureNowQuestionQueueProviderProps;

type ClosedQuestionAnswerFields = {
  readonly status: string | null;
  readonly answerCode: string | null;
  readonly answerText: string | null;
  readonly reason: string | null;
};

function closedSecureNowQuestionAnswerLines(question: ClosedQuestionAnswerFields): readonly string[] {
  if (!secureNowQuestionDispositionShowsStoredAnswerMetadata(question)) {
    return [];
  }

  return [
    secureNowQuestionReviewerClosedAnswerCodeLine(question.answerCode),
    secureNowQuestionReviewerClosedAnswerTextLine(question.answerText),
    secureNowQuestionReviewerClosedDispositionReasonLine(question.reason ?? null),
  ];
}

function openQuestionsCountLabel(count: number): string {
  if (count === 1) {
    return "1 open question";
  }

  return `${count} open questions`;
}

function reviewableQuestionsCountLabel(count: number): string {
  if (count === 1) {
    return "1 question to review";
  }

  return `${count} questions to review`;
}

export type SecureNowQuestionQueueSnapshotPromoProps = {
  readonly compact?: boolean;
};

export function SecureNowQuestionQueueSnapshotPromo(
  props: SecureNowQuestionQueueSnapshotPromoProps = {},
): React.JSX.Element | null {
  "use no memo";

  const compact = props.compact === true;
  const {
    drawerOpen,
    openQuestions,
    reviewableQuestions,
    beginQuestionReview,
  } = useSecureNowQuestionQueue();

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    document
      .getElementById("infra-diagrams-question-bar")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [drawerOpen]);

  if (reviewableQuestions.length === 0) {
    return null;
  }

  const promoShowsOpenCount = openQuestions.length > 0;
  const promoCountLabel = promoShowsOpenCount
    ? openQuestionsCountLabel(openQuestions.length)
    : reviewableQuestionsCountLabel(reviewableQuestions.length);
  const promoStatusLabel = promoShowsOpenCount ? "Open questions" : "Questions to review";

  if (compact) {
    return (
      <p
        className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="infra-diagrams-question-snapshot-promo"
      >
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid="infra-diagrams-question-review"
          onClick={beginQuestionReview}
        >
          {promoCountLabel} — Review
        </Button>
      </p>
    );
  }

  return (
    <p
      className={cn("m-0 flex flex-wrap items-center gap-x-2 gap-y-1", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="infra-diagrams-question-snapshot-promo"
    >
      <StatusTag kind="needs-attention" label={promoStatusLabel} />
      <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.helper)}>
        {promoCountLabel}
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        data-testid="infra-diagrams-question-review"
        onClick={beginQuestionReview}
      >
        Review questions
      </Button>
    </p>
  );
}

type SecureNowQuestionQueueBarProps = {
  readonly outline: InfraEvidenceMermaidOutline | null;
};

export function SecureNowQuestionQueueBar(props: SecureNowQuestionQueueBarProps): React.JSX.Element | null {
  "use no memo";

  const { outline } = props;
  const {
    drawerOpen,
    setDrawerOpen,
    filter,
    setFilter,
    currentQuestion,
    currentIndex,
    setCurrentIndex,
    selectedAnswer,
    setSelectedAnswer,
    reason,
    setReason,
    drawerAction,
    setDrawerAction,
    visitedQuestionKeys,
    busy,
    filteredQuestions,
    advanceWithoutPersistence,
    submitAction,
    currentQuestionMatchesInferredConnection,
  } = useSecureNowQuestionQueue();

  if (!drawerOpen) {
    return null;
  }

  const resourceTypeLabel = currentQuestion == null
    ? null
    : secureNowQuestionResourceTypeLabel(currentQuestion);
  const displayName = currentQuestion == null
    ? "Resource name was not stored."
    : secureNowQuestionResourceDisplayName(currentQuestion);
  const dispositionMutationResourceId = currentQuestion == null
    ? null
    : secureNowQuestionDispositionMutationResourceId(currentQuestion);
  const resourceIdMissing = dispositionMutationResourceId === null;
  const resourceIdStoredEmpty =
    dispositionMutationResourceId !== null
    && dispositionMutationResourceId.trim().length === 0
    && currentQuestion?.resourceId !== null
    && currentQuestion?.resourceId !== undefined
    && currentQuestion != null
    && !secureNowQuestionIsPolicyPackDispositionRow(currentQuestion);
  const resourceOnDiagram = currentQuestion == null
    || dispositionMutationResourceId === null
    || dispositionMutationResourceId.trim().length === 0
    || outline == null
    ? true
    : diagramOutlineIncludesFocusResource(outline, dispositionMutationResourceId);
  return (
    <div
      id="infra-diagrams-question-bar"
      className="scroll-mt-24 border-b border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/60"
      data-testid="infra-diagrams-question-bar"
      aria-label="SecureNow subscription questions"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0" data-testid="infra-diagrams-question-resource-identity">
            {resourceTypeLabel != null ? (
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{resourceTypeLabel}</span>
            ) : null}
            <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.body)} data-testid="infra-diagrams-question-resource-name">
              {displayName}
            </span>
          </div>
          {currentQuestion != null ? (
            <p
              className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}
              data-testid="infra-diagrams-question-text"
            >
              {currentQuestion.questionText === null || currentQuestion.questionText === undefined
                ? "Question text was not stored."
                : currentQuestion.questionText.trim().length === 0
                  ? "Question text was stored empty."
                  : currentQuestion.questionText.trim()}
            </p>
          ) : null}
          {currentQuestion != null && secureNowQuestionDispositionShowsStoredAnswerMetadata(currentQuestion) ? (
            <div
              className={cn("m-0 space-y-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="infra-diagrams-question-answer"
            >
              {closedSecureNowQuestionAnswerLines(currentQuestion).map((line, lineIndex) => (
                <p key={`${lineIndex}:${line}`} className="m-0">
                  {line}
                </p>
              ))}
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setDrawerOpen(false)}
        >
          Close
        </Button>
      </div>

      {currentQuestion != null && resourceIdMissing ? (
        <p
          className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          role="status"
        >
          Resource id was not stored.
        </p>
      ) : null}

      {currentQuestion != null && resourceIdStoredEmpty ? (
        <p
          className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          role="status"
        >
          Resource id was stored empty.
        </p>
      ) : null}

      {currentQuestion != null && !resourceIdMissing && !resourceIdStoredEmpty && outline === null ? (
        <p
          className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="infra-diagrams-question-outline-not-loaded"
          role="status"
        >
          Diagram outline was not loaded, so this question is not confirmed on the diagram.
        </p>
      ) : null}

      {currentQuestion != null && !resourceIdMissing && !resourceIdStoredEmpty && outline != null && !resourceOnDiagram ? (
        <p
          className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="infra-diagrams-question-off-diagram"
          role="status"
        >
          This resource is not on this diagram.
        </p>
      ) : null}

      {currentQuestion != null ? (
        <div className="mt-2 space-y-2">
          {secureNowQuestionDispositionShowsAnswerActions(currentQuestion) ? (
            <>
              {currentQuestion.answerCodes === null ? (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  No answer choices were stored on this question.
                </p>
              ) : null}
              {currentQuestion.answerCodes !== null && currentQuestion.answerCodes.length === 0 ? (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Answer choices were stored as an empty list.
                </p>
              ) : null}
              {currentQuestion.answerCodes?.some((code) => code.trim() === "NotSure") === true ? (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Not sure moves to the next question without storing an answer.
                </p>
              ) : null}
              {currentQuestionMatchesInferredConnection ? (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Asked because a connection was inferred. Answering does not store a link.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {currentQuestion.answerCodes?.map((answerCode) => {
                  const normalizedAnswerCode = answerCode.trim();

                  return (
                  <Button
                    key={normalizedAnswerCode}
                    type="button"
                    size="sm"
                    variant={selectedAnswer === normalizedAnswerCode ? "primary" : "outline"}
                    disabled={busy}
                    onClick={() => {
                      if (normalizedAnswerCode === "NotSure") {
                        advanceWithoutPersistence();
                        return;
                      }

                      setSelectedAnswer(normalizedAnswerCode);
                      setDrawerAction("answer");
                    }}
                  >
                    {normalizedAnswerCode === "NotSure"
                      ? "Not sure. This does not store an answer."
                      : answerCode.trim().length === 0
                        ? "Answer choice was stored empty."
                        : secureNowQuestionPackAnswerChoiceLabel(currentQuestion, answerCode)}
                  </Button>
                  );
                })}
              </div>
              {selectedAnswer != null ? (
                <Button type="button" size="sm" variant="primary" disabled={busy} onClick={() => void submitAction()}>
                  Save answer
                </Button>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setDrawerAction("ignore");
                    setReason("");
                    setSelectedAnswer(null);
                  }}
                >
                  Don&apos;t ask again
                </Button>
                {drawerAction === "ignore" ? (
                  <div className="flex min-w-[18rem] flex-1 gap-2">
                    <input
                      aria-label="Reason for not asking again"
                      className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Reason required"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      disabled={busy || reason.trim().length === 0}
                      onClick={() => void submitAction()}
                    >
                      Save
                    </Button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <input
                aria-label="Reason for reopening"
                className="min-w-[18rem] rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Reason required to reopen"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || reason.trim().length === 0}
                onClick={() => {
                  setDrawerAction("reopen");
                  void submitAction("reopen");
                }}
              >
                Reopen
              </Button>
            </div>
          )}

          <div className="flex justify-between gap-2 border-t border-neutral-200 pt-2 dark:border-neutral-800">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy || currentIndex === 0}
              onClick={() => setCurrentIndex((current) => Math.max(current - 1, 0))}
            >
              Previous
            </Button>
            <span className={cn("self-center text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {currentIndex + 1} of {filteredQuestions.length}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={
                busy
                || currentIndex >= filteredQuestions.length - 1
                || visitedQuestionKeys.size >= VISIT_CAP
              }
              onClick={() => setCurrentIndex((current) => Math.min(current + 1, filteredQuestions.length - 1))}
            >
              Next
            </Button>
          </div>

          <CollapsibleSection
            title="Question details"
            sectionTestId="infra-diagrams-question-details"
            summaryLine="Why SecureNow is asking, filters, and visit limit"
            className="mb-0"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Question filters">
                {(
                  [
                    "Open",
                    "Answered",
                    "Dismissed",
                    SECURENOW_QUESTION_DISPOSITION_STATUS_NOT_STORED_FILTER,
                  ] as const
                ).map((option) => (
                  <Button
                    key={option}
                    type="button"
                    size="sm"
                    variant={filter === option ? "primary" : "outline"}
                    disabled={busy}
                    onClick={() => {
                      setFilter(option);
                      setCurrentIndex(0);
                      setSelectedAnswer(null);
                      setReason("");
                      setDrawerAction("answer");
                    }}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn("rounded border border-neutral-300 px-2 py-1", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="infra-diagrams-question-disposition-status"
                >
                  {secureNowQuestionDispositionReviewerStatusLabel(currentQuestion)}
                </span>
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Visit limit: {Math.min(visitedQuestionKeys.size, VISIT_CAP)} of {VISIT_CAP}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Why SecureNow is asking</h3>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="infra-diagrams-question-reason">
                  {secureNowQuestionReviewerReasonTextLine(currentQuestion.reasonText)}
                </p>
              </div>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {secureNowQuestionReviewerSourceLine(currentQuestion.sourceLine)}
              </p>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Source: {secureNowQuestionReviewerSourceLabel(
                  currentQuestion,
                  currentQuestionMatchesInferredConnection,
                )}
              </p>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Scope: {secureNowQuestionReviewerScopeLabel(
                  currentQuestion,
                  currentQuestionMatchesInferredConnection,
                )}
              </p>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Subscription: {secureNowQuestionReviewerSubscriptionLabel(currentQuestion.subscriptionId)}
              </p>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {secureNowQuestionReviewerExpirationDisplayLine(currentQuestion.expirationUtc)}
                {currentQuestion.isExpired === null
                    && secureNowQuestionReviewerExpirationUtcStamp(currentQuestion.expirationUtc) === null
                  ? " · Expiration status was not stored."
                  : secureNowQuestionShowsExpired(
                      currentQuestion.expirationUtc,
                      currentQuestion.isExpired,
                    )
                    ? " · Expired"
                    : " · Not expired."}
              </p>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {secureNowQuestionReviewerEvidenceFingerprintLine(currentQuestion.evidenceFingerprint)}
              </p>
            </div>
          </CollapsibleSection>
        </div>
      ) : (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          No questions match this filter.
        </p>
      )}
    </div>
  );
}

/** @deprecated Use SecureNowQuestionQueueSnapshotPromo */
export function SecureNowQuestionQueueHero(): React.JSX.Element | null {
  return <SecureNowQuestionQueueSnapshotPromo />;
}

/** @deprecated Use SecureNowQuestionQueueBar */
export function SecureNowQuestionQueueDrawer(): React.JSX.Element | null {
  return <SecureNowQuestionQueueBar outline={null} />;
}

/** Legacy mount: snapshot promo and bar together (tests and shallow embeds). */
export function SecureNowQuestionQueue(props: SecureNowQuestionQueueProps): React.JSX.Element | null {
  return (
    <SecureNowQuestionQueueProvider {...props}>
      <SecureNowQuestionQueueSnapshotPromo />
      <SecureNowQuestionQueueBar outline={null} />
    </SecureNowQuestionQueueProvider>
  );
}
