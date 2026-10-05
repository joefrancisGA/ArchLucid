"use client";

import { Button } from "@/components/ui/button";
import { formatDiagramArmTypeFriendlyName } from "@/lib/infra-evidence/format-diagram-arm-type-friendly-name";
import { normalizeSecureNowResourceNameForDisplay } from "@/lib/infra-evidence/format-azure-resource-display";
import { secureNowQuestionAnswerLabel } from "@/lib/infra-evidence/securenow-question-answer-label";
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

function questionStatusLabel(status: string): string {
  if (status === "Answered") return "Answered";
  if (status === "Ignored" || status === "Dismissed") return "Dismissed";
  return "Open";
}

export function SecureNowQuestionQueueHero(): React.JSX.Element | null {
  const { openQuestions, setFilter, setCurrentIndex, setDrawerOpen } = useSecureNowQuestionQueue();

  if (openQuestions.length === 0) {
    return null;
  }

  return (
    <section
      className="flex flex-col gap-3 rounded-md border border-[var(--al-accent-border-focus)] bg-white p-4 dark:bg-neutral-950 sm:flex-row sm:items-center sm:justify-between"
      data-testid="infra-diagrams-question-hero"
      aria-label="SecureNow subscription questions"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
        SecureNow has {openQuestions.length === 1 ? "1 question" : `${openQuestions.length} questions`} about this subscription.
      </p>
      <Button
        type="button"
        size="sm"
        variant="primary"
        onClick={() => {
          setFilter("Open");
          setCurrentIndex(0);
          setDrawerOpen(true);
        }}
      >
        Start answering
      </Button>
    </section>
  );
}

export function SecureNowQuestionQueueDrawer(): React.JSX.Element | null {
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
  } = useSecureNowQuestionQueue();

  if (!drawerOpen) {
    return null;
  }

  const friendlyType = currentQuestion?.resourceType != null
    ? formatDiagramArmTypeFriendlyName(currentQuestion.resourceType)
    : null;
  const displayName = currentQuestion?.resourceName != null && currentQuestion.resourceName.trim().length > 0
    ? normalizeSecureNowResourceNameForDisplay(currentQuestion.resourceName)
    : null;

  return (
    <aside
      className="border border-neutral-300 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="infra-diagrams-question-drawer"
      aria-label="SecureNow question drawer"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Subscription questions</h2>
          <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Visit limit: {Math.min(visitedQuestionKeys.size, VISIT_CAP)} of {VISIT_CAP}
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setDrawerOpen(false)}>
          Close
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Question filters">
        {(["Open", "Answered", "Dismissed"] as const).map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={filter === option ? "primary" : "outline"}
            onClick={() => {
              setFilter(option);
              setCurrentIndex(0);
              setSelectedAnswer(null);
              setDrawerAction("answer");
            }}
          >
            {option}
          </Button>
        ))}
      </div>

      {currentQuestion != null ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded border border-neutral-300 px-2 py-1", OPERATOR_TYPOGRAPHY.helper)}>
              {questionStatusLabel(currentQuestion.status)}
            </span>
          </div>

          {displayName != null ? (
            <div className="space-y-1" data-testid="infra-diagrams-question-resource-identity">
              {friendlyType != null ? (
                <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {friendlyType}
                </p>
              ) : null}
              <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)} data-testid="infra-diagrams-question-resource-name">
                {displayName}
              </p>
            </div>
          ) : null}

          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="infra-diagrams-question-text">
            {currentQuestion.questionText}
          </p>

          {currentQuestion.reasonText.trim().length > 0 ? (
            <div className="space-y-1">
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Why SecureNow is asking</h3>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="infra-diagrams-question-reason">
                {currentQuestion.reasonText}
              </p>
            </div>
          ) : null}

          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {currentQuestion.sourceLine}
          </p>

          {currentQuestion.status === "Open" ? (
            <>
              <div className="flex flex-wrap gap-2">
                {currentQuestion.answerCodes.map((answerCode) => (
                  <Button
                    key={answerCode}
                    type="button"
                    size="sm"
                    variant={selectedAnswer === answerCode ? "primary" : "outline"}
                    onClick={() => {
                      if (answerCode === "NotSure") {
                        advanceWithoutPersistence();
                        return;
                      }
                      setSelectedAnswer(answerCode);
                      setDrawerAction("answer");
                    }}
                  >
                    {secureNowQuestionAnswerLabel(answerCode)}
                  </Button>
                ))}
              </div>
              {selectedAnswer != null ? (
                <Button type="button" size="sm" variant="primary" disabled={busy} onClick={() => void submitAction()}>
                  Continue
                </Button>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
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

          <div className="flex justify-between gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((current) => Math.max(current - 1, 0))}
            >
              Previous
            </Button>
            <span className={cn("self-center text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {currentIndex + 1} of {filteredQuestions.length}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={currentIndex >= filteredQuestions.length - 1 || visitedQuestionKeys.size >= VISIT_CAP}
              onClick={() => setCurrentIndex((current) => Math.min(current + 1, filteredQuestions.length - 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : (
        <p className={cn("m-0 mt-4 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          No questions match this filter.
        </p>
      )}
    </aside>
  );
}

/** Legacy mount: hero and drawer together (tests and shallow embeds). */
export function SecureNowQuestionQueue(props: SecureNowQuestionQueueProps): React.JSX.Element | null {
  return (
    <SecureNowQuestionQueueProvider {...props}>
      <SecureNowQuestionQueueHero />
      <SecureNowQuestionQueueDrawer />
    </SecureNowQuestionQueueProvider>
  );
}
