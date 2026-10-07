"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
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

type QueueFilter = "Open" | "Answered" | "Dismissed";
type DrawerAction = "answer" | "ignore" | "reopen";

const VISIT_CAP = 10;

export type SecureNowQuestionQueueProviderProps = {
  readonly snapshotId: string;
  readonly children: ReactNode;
};

type SecureNowQuestionQueueContextValue = {
  readonly loading: boolean;
  readonly openQuestions: readonly SecureNowQuestion[];
  readonly filteredQuestions: readonly SecureNowQuestion[];
  readonly currentQuestion: SecureNowQuestion | null;
  readonly currentIndex: number;
  readonly filter: QueueFilter;
  readonly drawerOpen: boolean;
  readonly selectedAnswer: string | null;
  readonly reason: string;
  readonly drawerAction: DrawerAction;
  readonly visitedQuestionKeys: ReadonlySet<string>;
  readonly busy: boolean;
  readonly setFilter: (filter: QueueFilter) => void;
  readonly setDrawerOpen: (open: boolean) => void;
  readonly setCurrentIndex: (index: number | ((current: number) => number)) => void;
  readonly setSelectedAnswer: (answer: string | null) => void;
  readonly setReason: (reason: string) => void;
  readonly setDrawerAction: (action: DrawerAction) => void;
  readonly advanceWithoutPersistence: () => void;
  readonly submitAction: (action?: DrawerAction) => Promise<void>;
};

const SecureNowQuestionQueueContext = createContext<SecureNowQuestionQueueContextValue | null>(null);

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function questionIdentity(question: SecureNowQuestion): string {
  return `${normalize(question.subscriptionId)}|${normalize(question.resourceId)}|${normalize(question.questionKey)}`;
}

function isDismissed(question: SecureNowQuestion): boolean {
  return question.status === "Ignored" || question.status === "Dismissed";
}

function filterQuestions(questions: readonly SecureNowQuestion[], filter: QueueFilter): SecureNowQuestion[] {
  return questions.filter((question) => {
    if (filter === "Open") {
      return question.status !== "Answered" && !isDismissed(question) && !question.isExpired;
    }
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

export function SecureNowQuestionQueueProvider(
  props: SecureNowQuestionQueueProviderProps,
): React.JSX.Element | null {
  const { snapshotId, children } = props;
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

  useEffect(() => {
    setVisitedQuestionKeys(new Set());
    setSessionSkippedQuestionKeys(new Set());
  }, [snapshotId]);

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
    () => questions.filter(
      (question) => question.status !== "Answered" && !isDismissed(question) && !question.isExpired,
    ),
    [questions],
  );
  const filteredQuestions = useMemo(
    () => filterQuestions(questions, filter).filter(
      (question) => !sessionSkippedQuestionKeys.has(questionIdentity(question)),
    ),
    [filter, questions, sessionSkippedQuestionKeys],
  );
  const currentQuestion = filteredQuestions[currentIndex] ?? null;

  useEffect(() => {
    if (!drawerOpen || currentQuestion == null) return;
    const identity = questionIdentity(currentQuestion);
    setVisitedQuestionKeys((current) => {
      if (current.has(identity) || current.size >= VISIT_CAP) return current;
      const next = new Set(current);
      next.add(identity);
      return next;
    });
  }, [currentQuestion, drawerOpen]);

  const advanceWithoutPersistence = useCallback(() => {
    if (currentQuestion == null) return;
    setSessionSkippedQuestionKeys((current) => new Set(current).add(questionIdentity(currentQuestion)));
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

  const contextValue = useMemo<SecureNowQuestionQueueContextValue>(
    () => ({
      loading,
      openQuestions,
      filteredQuestions,
      currentQuestion,
      currentIndex,
      filter,
      drawerOpen,
      selectedAnswer,
      reason,
      drawerAction,
      visitedQuestionKeys,
      busy,
      setFilter,
      setDrawerOpen,
      setCurrentIndex,
      setSelectedAnswer,
      setReason,
      setDrawerAction,
      advanceWithoutPersistence,
      submitAction,
    }),
    [
      advanceWithoutPersistence,
      busy,
      currentIndex,
      currentQuestion,
      drawerAction,
      drawerOpen,
      filter,
      filteredQuestions,
      loading,
      openQuestions,
      reason,
      selectedAnswer,
      submitAction,
      visitedQuestionKeys,
    ],
  );

  if (snapshotId.trim().length === 0) {
    return <>{children}</>;
  }

  return (
    <SecureNowQuestionQueueContext.Provider value={contextValue}>
      <div className="space-y-3" data-testid="securenow-question-queue">
        {error != null ? (
          <OperatorMutationInlineError
            message={error.message}
            recoveryScenario={operatorInferredConnectionPanelErrorRecoveryScenario(error.kind)}
          />
        ) : null}
        {children}
      </div>
    </SecureNowQuestionQueueContext.Provider>
  );
}

export function useSecureNowQuestionQueue(): SecureNowQuestionQueueContextValue {
  const value = useContext(SecureNowQuestionQueueContext);

  if (value == null) {
    throw new Error("useSecureNowQuestionQueue must be used within SecureNowQuestionQueueProvider.");
  }

  return value;
}

export function useSecureNowQuestionSubjectNodeId(): string | null {
  const { drawerOpen, currentQuestion } = useSecureNowQuestionQueue();
  const resourceId = currentQuestion?.resourceId.trim() ?? "";

  if (!drawerOpen || resourceId.length === 0) {
    return null;
  }

  return resourceId;
}

export { questionIdentity, VISIT_CAP };
