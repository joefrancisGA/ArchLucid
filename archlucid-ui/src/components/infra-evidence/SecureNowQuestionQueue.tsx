"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  answerSecureNowQuestion,
  ignoreSecureNowQuestion,
  listSecureNowQuestions,
  reopenSecureNowQuestion,
  type SecureNowQuestion,
} from "@/lib/infra-evidence/securenow-question-queue-api";
import {
  confirmOperatorInferredConnection,
  dismissOperatorInferredConnection,
  listOperatorInferredConnections,
} from "@/lib/infra-evidence/operator-inferred-connection-api";
import {
  operatorInferredConnectionPanelErrorFromUnknown,
  operatorInferredConnectionPanelErrorRecoveryScenario,
  type OperatorInferredConnectionPanelError,
} from "@/lib/infra-evidence/operator-inferred-connection-panel-error";
import type { OperatorInferredConnectionRow } from "@/lib/infra-evidence/operator-inferred-connection-types";
import { cn } from "@/lib/utils";

type SecureNowQuestionQueueProps = {
  readonly snapshotId: string;
};

type QueueFilter = "Open" | "Answered" | "Dismissed";
type DrawerAction = "answer" | "ignore" | "reopen";

const VISIT_CAP = 10;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function isDismissed(question: SecureNowQuestion): boolean {
  return question.status === "Ignored" || question.status === "Dismissed";
}

function filterQuestions(questions: readonly SecureNowQuestion[], filter: QueueFilter): SecureNowQuestion[] {
  return questions.filter((question) => {
    if (filter === "Open") return question.status === "Open" && !question.isExpired;
    if (filter === "Answered") return question.status === "Answered";
    return isDismissed(question);
  });
}

function findInferredConnection(
  question: SecureNowQuestion,
  connections: readonly OperatorInferredConnectionRow[],
): OperatorInferredConnectionRow | null {
  const ruleKey = normalize(question.questionKey.split("@", 1)[0]);
  return connections.find((connection) => {
    const resourceMatches =
      normalize(connection.fromArmId ?? "") === normalize(question.resourceId)
      || normalize(connection.toArmId ?? "") === normalize(question.resourceId);
    return resourceMatches && normalize(connection.ruleName ?? "") === ruleKey;
  }) ?? null;
}

function questionStatusLabel(question: SecureNowQuestion): string {
  if (question.status === "Answered") return "Answered";
  if (isDismissed(question)) return "Dismissed";
  return "Open";
}

export function SecureNowQuestionQueue(
  props: SecureNowQuestionQueueProps,
): React.JSX.Element | null {
  const { snapshotId } = props;
  const [questions, setQuestions] = useState<SecureNowQuestion[]>([]);
  const [inferredConnections, setInferredConnections] = useState<OperatorInferredConnectionRow[]>([]);
  const [filter, setFilter] = useState<QueueFilter>("Open");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [drawerAction, setDrawerAction] = useState<DrawerAction>("answer");
  const [visitedQuestionKeys, setVisitedQuestionKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<OperatorInferredConnectionPanelError | null>(null);
  const [sessionSkippedQuestionKeys, setSessionSkippedQuestionKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const loadQuestions = useCallback(async () => {
    if (snapshotId.trim().length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const [questionsResult, connectionsResult] = await Promise.allSettled([
        listSecureNowQuestions(snapshotId),
        listOperatorInferredConnections(snapshotId),
      ]);
      if (questionsResult.status === "rejected") {
        throw questionsResult.reason;
      }

      setQuestions(questionsResult.value);
      if (connectionsResult.status === "fulfilled") {
        setInferredConnections(connectionsResult.value);
      } else {
        setInferredConnections([]);
        setError(
          operatorInferredConnectionPanelErrorFromUnknown(
            connectionsResult.reason,
            "Could not load inferred connections.",
            "load",
          ),
        );
      }
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setReason("");
    } catch (loadError) {
      setError(
        operatorInferredConnectionPanelErrorFromUnknown(
          loadError,
          "Could not load SecureNow questions.",
          "load",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [snapshotId]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const openQuestions = useMemo(
    () => questions.filter((question) => question.status === "Open" && !question.isExpired),
    [questions],
  );
  const filteredQuestions = useMemo(
    () => filterQuestions(questions, filter).filter(
      (question) => !sessionSkippedQuestionKeys.has(question.questionKey),
    ),
    [filter, questions, sessionSkippedQuestionKeys],
  );
  const currentQuestion = filteredQuestions[currentIndex] ?? null;

  useEffect(() => {
    if (!drawerOpen || currentQuestion == null) return;
    setVisitedQuestionKeys((current) => {
      if (current.has(currentQuestion.questionKey) || current.size >= VISIT_CAP) return current;
      const next = new Set(current);
      next.add(currentQuestion.questionKey);
      return next;
    });
  }, [currentQuestion, drawerOpen]);

  const advanceWithoutPersistence = useCallback(() => {
    if (currentQuestion == null) return;
    setSessionSkippedQuestionKeys((current) => new Set(current).add(currentQuestion.questionKey));
    setSelectedAnswer(null);
    setReason("");
    setCurrentIndex((current) => Math.min(current, Math.max(filteredQuestions.length - 2, 0)));
  }, [currentQuestion, filteredQuestions.length]);

  const submitAction = useCallback(async (action: DrawerAction = drawerAction) => {
    if (currentQuestion == null || busy) return;
    if (action === "ignore" && reason.trim().length === 0) return;
    if (action === "reopen" && reason.trim().length === 0) return;
    if (action === "answer" && selectedAnswer == null) return;

    setBusy(true);
    setError(null);
    try {
      if (action === "ignore") {
        await ignoreSecureNowQuestion(snapshotId, {
          subscriptionId: currentQuestion.subscriptionId,
          resourceId: currentQuestion.resourceId,
          questionKey: currentQuestion.questionKey,
          source: currentQuestion.source,
          scopeKind: currentQuestion.scopeKind,
          reason: reason.trim(),
          evidenceFingerprint: currentQuestion.evidenceFingerprint,
        });
      } else if (action === "reopen") {
        await reopenSecureNowQuestion(snapshotId, {
          subscriptionId: currentQuestion.subscriptionId,
          resourceId: currentQuestion.resourceId,
          questionKey: currentQuestion.questionKey,
          reason: reason.trim(),
        });
      } else if (currentQuestion.source === "InferredConnection") {
        const connection = findInferredConnection(currentQuestion, inferredConnections);
        if (connection == null || (selectedAnswer !== "Yes" && selectedAnswer !== "No")) {
          throw new Error("The inferred connection for this question is no longer available.");
        }
        if (selectedAnswer === "Yes") {
          await confirmOperatorInferredConnection(snapshotId, { connectionId: connection.connectionId });
        } else {
          await dismissOperatorInferredConnection(snapshotId, { connectionId: connection.connectionId });
        }
      } else {
        await answerSecureNowQuestion(snapshotId, {
          subscriptionId: currentQuestion.subscriptionId,
          resourceId: currentQuestion.resourceId,
          questionKey: currentQuestion.questionKey,
          source: currentQuestion.source,
          scopeKind: currentQuestion.scopeKind,
          answerCode: selectedAnswer,
          answerText: selectedAnswer,
          reason: "Answered in the SecureNow subscription question queue.",
          evidenceFingerprint: currentQuestion.evidenceFingerprint,
        });
      }
      await loadQuestions();
      setSelectedAnswer(null);
      setReason("");
      setDrawerAction("answer");
    } catch (submitError) {
      setError(
        operatorInferredConnectionPanelErrorFromUnknown(
          submitError,
          "Could not save the question update.",
          "mutation",
        ),
      );
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    currentQuestion,
    drawerAction,
    inferredConnections,
    loadQuestions,
    reason,
    selectedAnswer,
    snapshotId,
  ]);

  if (snapshotId.trim().length === 0 || (questions.length === 0 && loading)) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid="securenow-question-queue">
      {error != null ? (
        <OperatorMutationInlineError
          message={error.message}
          recoveryScenario={operatorInferredConnectionPanelErrorRecoveryScenario(error.kind)}
        />
      ) : null}
      {openQuestions.length > 0 ? (
        <section
          className="flex flex-col gap-3 rounded-md border border-[var(--al-accent-border-focus)] bg-white p-4 dark:bg-neutral-950 sm:flex-row sm:items-center sm:justify-between"
          data-testid="infra-diagrams-question-hero"
          aria-label="SecureNow subscription questions"
        >
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            SecureNow has {openQuestions.length === 1 ? "1 question" : `${openQuestions.length} questions`} about this subscription.
          </p>
          <Button type="button" size="sm" variant="primary" onClick={() => {
            setFilter("Open");
            setCurrentIndex(0);
            setDrawerOpen(true);
          }}>
            Start answering
          </Button>
        </section>
      ) : null}

      {drawerOpen ? (
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
                  {questionStatusLabel(currentQuestion)}
                </span>
                <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {currentQuestion.sourceLine}
                </span>
              </div>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="infra-diagrams-question-text">
                {currentQuestion.questionText}
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
                        {answerCode}
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
                        <Button type="button" size="sm" variant="primary" disabled={busy || reason.trim().length === 0} onClick={() => void submitAction()}>
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
                  <Button type="button" size="sm" variant="outline" disabled={busy || reason.trim().length === 0} onClick={() => {
                    setDrawerAction("reopen");
                    void submitAction("reopen");
                  }}>
                    Reopen
                  </Button>
                </div>
              )}

              <div className="flex justify-between gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
                <Button type="button" size="sm" variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((current) => Math.max(current - 1, 0))}>
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
      ) : null}
    </div>
  );
}
