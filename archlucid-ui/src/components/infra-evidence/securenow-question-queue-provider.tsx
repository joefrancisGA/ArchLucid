"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import {
  answerSecureNowQuestion,
  ignoreSecureNowQuestion,
  listSecureNowQuestions,
  reopenSecureNowQuestion,
  secureNowQuestionListedSnapshotMatchesContext,
  type SecureNowQuestion,
} from "@/lib/infra-evidence/securenow-question-queue-api";
import {
  secureNowQuestionDispositionMutationEvidenceFingerprint,
  secureNowQuestionDispositionMutationQuestionKey,
  secureNowQuestionDispositionMutationResourceId,
  secureNowQuestionDispositionMutationScopeKind,
  secureNowQuestionDispositionMutationSource,
  secureNowQuestionDispositionMutationSubscriptionId,
} from "@/lib/infra-evidence/securenow-question-mutation-resource-id";
import {
  secureNowQuestionCountsAsAnsweredFilterRow,
  secureNowQuestionCountsAsDismissedFilterRow,
  secureNowQuestionCountsAsOpenQueueRow,
  secureNowQuestionCountsAsReviewableQueueRow,
  secureNowQuestionDispositionShowsAnswerActions,
  secureNowQuestionQueueInitialReviewFilter,
} from "@/lib/infra-evidence/securenow-question-disposition-status";
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
  readonly questionsLoaded: boolean;
  readonly loadError: boolean;
  readonly openQuestions: readonly SecureNowQuestion[];
  readonly reviewableQuestions: readonly SecureNowQuestion[];
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
  readonly currentQuestionMatchesInferredConnection: boolean;
  readonly setFilter: (filter: QueueFilter) => void;
  readonly setDrawerOpen: (open: boolean) => void;
  readonly setCurrentIndex: (index: number | ((current: number) => number)) => void;
  readonly setSelectedAnswer: (answer: string | null) => void;
  readonly setReason: (reason: string) => void;
  readonly setDrawerAction: (action: DrawerAction) => void;
  readonly advanceWithoutPersistence: () => void;
  readonly beginQuestionReview: () => void;
  readonly submitAction: (action?: DrawerAction) => Promise<void>;
};

const SecureNowQuestionQueueContext = createContext<SecureNowQuestionQueueContextValue | null>(null);

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

// The API question key is generated with the same punctuation-to-hyphen rule.
function normalizeRuleKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeConnectionId(value: string): string {
  return value.replace(/-/g, "").toLowerCase();
}

function connectionIdFromQuestionKey(questionKey: string): string | null {
  const versionIndex = questionKey.toLowerCase().lastIndexOf("@v");
  const base = versionIndex >= 0 ? questionKey.slice(0, versionIndex) : questionKey;
  const suffix = base.split("-").pop() ?? "";

  if (!/^[0-9a-f]{32}$/i.test(suffix)) {
    return null;
  }

  return normalizeConnectionId(suffix);
}

function questionIdentity(question: SecureNowQuestion): string {
  const mutationQuestionKey =
    secureNowQuestionDispositionMutationQuestionKey(question.questionKey);
  let keySegment: string;
  if (mutationQuestionKey !== null) {
    keySegment = mutationQuestionKey;
  } else {
    const dispositionId = question.dispositionId?.trim() ?? "";
    if (dispositionId.length > 0) {
      keySegment = `missing-key:disposition:${normalize(dispositionId)}`;
    } else {
      const fingerprint =
        secureNowQuestionDispositionMutationEvidenceFingerprint(question.evidenceFingerprint);
      keySegment = fingerprint !== null
        ? `missing-key:fingerprint:${normalize(fingerprint)}`
        : `missing-key:${normalize(question.questionText)}`;
    }
  }

  return `${normalize(question.subscriptionId ?? "")}|${normalize(question.resourceId ?? "")}|${keySegment}`;
}

function filterQuestions(questions: readonly SecureNowQuestion[], filter: QueueFilter): SecureNowQuestion[] {
  return questions.filter((question) => {
    if (filter === "Open") {
      return secureNowQuestionCountsAsOpenQueueRow(question);
    }
    if (filter === "Answered") {
      return secureNowQuestionCountsAsAnsweredFilterRow(question);
    }
    return secureNowQuestionCountsAsDismissedFilterRow(question);
  });
}

function findInferredConnection(
  question: SecureNowQuestion,
  connections: readonly OperatorInferredConnectionRow[],
): OperatorInferredConnectionRow | null {
  const questionKey = question.questionKey?.trim() ?? "";
  if (questionKey.length === 0) {
    return null;
  }

  const embeddedConnectionId = connectionIdFromQuestionKey(questionKey);

  if (embeddedConnectionId != null) {
    return connections.find((connection) =>
      normalizeConnectionId(connection.connectionId) === embeddedConnectionId,
    ) ?? null;
  }

  const ruleKey = normalize(questionKey.split("@", 1)[0]);
  return connections.find((connection) => {
    const resourceMatches =
      normalize(connection.fromArmId ?? "") === normalize(question.resourceId ?? "")
      || normalize(connection.toArmId ?? "") === normalize(question.resourceId ?? "");
    return resourceMatches && normalizeRuleKey(connection.ruleName ?? "") === ruleKey;
  }) ?? null;
}

export function SecureNowQuestionQueueProvider(
  props: SecureNowQuestionQueueProviderProps,
): React.JSX.Element | null {
  "use no memo";

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
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const loadSequence = useRef(0);
  const [error, setError] = useState<OperatorInferredConnectionPanelError | null>(null);
  const [sessionSkippedQuestionKeys, setSessionSkippedQuestionKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  useEffect(() => {
    setQuestions([]);
    setInferredConnections([]);
    setVisitedQuestionKeys(new Set());
    setSessionSkippedQuestionKeys(new Set());
    setQuestionsLoaded(false);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setReason("");
  }, [snapshotId]);

  const loadQuestions = useCallback(async () => {
    if (snapshotId.trim().length === 0) return;
    const requestSequence = ++loadSequence.current;
    setLoading(true);
    setQuestionsLoaded(false);
    setError(null);
    try {
      const [questionsResult, connectionsResult] = await Promise.allSettled([
        listSecureNowQuestions(snapshotId),
        listOperatorInferredConnections(snapshotId),
      ]);
      if (questionsResult.status === "rejected") {
        throw questionsResult.reason;
      }

      // Snapshot navigation can leave older requests in flight; only the newest request owns queue state.
      if (requestSequence !== loadSequence.current) return;

      setQuestions(questionsResult.value);
      setQuestionsLoaded(true);
      setSessionSkippedQuestionKeys(new Set());
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
      if (requestSequence !== loadSequence.current) return;

      setError(
        operatorInferredConnectionPanelErrorFromUnknown(
          loadError,
          "Could not load SecureNow questions.",
          "load",
        ),
      );
    } finally {
      if (requestSequence === loadSequence.current) {
        setLoading(false);
      }
    }
  }, [snapshotId]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const openQuestions = useMemo(
    () => questions.filter((question) => secureNowQuestionCountsAsOpenQueueRow(question)),
    [questions],
  );
  const reviewableQuestions = useMemo(
    () => questions.filter((question) => secureNowQuestionCountsAsReviewableQueueRow(question)),
    [questions],
  );
  const filteredQuestions = useMemo(
    () => filterQuestions(questions, filter).filter(
      (question) => !sessionSkippedQuestionKeys.has(questionIdentity(question)),
    ),
    [filter, questions, sessionSkippedQuestionKeys],
  );
  const currentQuestion = filteredQuestions[currentIndex] ?? null;
  const currentQuestionMatchesInferredConnection = useMemo(
    () => currentQuestion != null
      && findInferredConnection(currentQuestion, inferredConnections) != null,
    [currentQuestion, inferredConnections],
  );

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

  const beginQuestionReview = useCallback(() => {
    setSessionSkippedQuestionKeys(new Set());
    setVisitedQuestionKeys(new Set());
    setFilter(secureNowQuestionQueueInitialReviewFilter(questions));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setReason("");
    setDrawerAction("answer");
    setDrawerOpen(true);
  }, [questions]);

  const submitAction = useCallback(async (action: DrawerAction = drawerAction) => {
    if (!questionsLoaded || currentQuestion == null || busy) return;

    if (!secureNowQuestionListedSnapshotMatchesContext(currentQuestion.snapshotId, snapshotId)) {
      return;
    }
    if (action === "ignore" && reason.trim().length === 0) return;
    if (action === "reopen" && reason.trim().length === 0) return;
    if (action === "answer" && (selectedAnswer == null || selectedAnswer.trim().length === 0)) return;
    if (
      (action === "answer" || action === "ignore")
      && !secureNowQuestionDispositionShowsAnswerActions(currentQuestion)
    ) {
      return;
    }

    const mutationQuestionKey =
      secureNowQuestionDispositionMutationQuestionKey(currentQuestion.questionKey);
    if (mutationQuestionKey === null) {
      setError(
        operatorInferredConnectionPanelErrorFromUnknown(
          new Error("Question key was not stored."),
          "Could not save the question update.",
          "mutation",
        ),
      );
      return;
    }

    const mutationSubscriptionId =
      secureNowQuestionDispositionMutationSubscriptionId(currentQuestion.subscriptionId);
    if (mutationSubscriptionId === null) {
      setError(
        operatorInferredConnectionPanelErrorFromUnknown(
          new Error("Subscription id was not stored."),
          "Could not save the question update.",
          "mutation",
        ),
      );
      return;
    }

    const mutationResourceId = secureNowQuestionDispositionMutationResourceId(currentQuestion);
    if (mutationResourceId === null) {
      setError(
        operatorInferredConnectionPanelErrorFromUnknown(
          new Error("Resource id was not stored."),
          "Could not save the question update.",
          "mutation",
        ),
      );
      return;
    }

    const mutationSource = secureNowQuestionDispositionMutationSource(currentQuestion);
    const mutationScopeKind = secureNowQuestionDispositionMutationScopeKind(currentQuestion);
    const matchedInferredConnection =
      action === "answer"
        ? findInferredConnection(currentQuestion, inferredConnections)
        : null;
    const usesInferredConnectionConfirm =
      matchedInferredConnection != null
      && (selectedAnswer === "Yes" || selectedAnswer === "No");

    const mutationEvidenceFingerprint =
      secureNowQuestionDispositionMutationEvidenceFingerprint(currentQuestion.evidenceFingerprint);

    if (
      action !== "reopen"
      && !usesInferredConnectionConfirm
      && mutationEvidenceFingerprint === null
    ) {
      setError(
        operatorInferredConnectionPanelErrorFromUnknown(
          new Error("Evidence fingerprint was not stored."),
          "Could not save the question update.",
          "mutation",
        ),
      );
      return;
    }

    if (
      action !== "reopen"
      && !usesInferredConnectionConfirm
      && (mutationSource === null || mutationScopeKind === null)
    ) {
      setError(
        operatorInferredConnectionPanelErrorFromUnknown(
          new Error("Question source or scope was not stored."),
          "Could not save the question update.",
          "mutation",
        ),
      );
      return;
    }

    const dispositionInferredConnection = findInferredConnection(
      currentQuestion,
      inferredConnections,
    );
    const dispositionMutationSource =
      dispositionInferredConnection != null ? "InferredConnection" : mutationSource!;
    const dispositionMutationScopeKind =
      dispositionInferredConnection != null ? "Resource" : mutationScopeKind!;

    setBusy(true);
    setError(null);
    try {
      if (action === "ignore") {
        await ignoreSecureNowQuestion(snapshotId, {
          subscriptionId: mutationSubscriptionId,
          resourceId: mutationResourceId,
          questionKey: mutationQuestionKey,
          source: dispositionMutationSource,
          scopeKind: dispositionMutationScopeKind,
          reason: reason.trim(),
          evidenceFingerprint: mutationEvidenceFingerprint!,
        });
      } else if (action === "reopen") {
        await reopenSecureNowQuestion(snapshotId, {
          subscriptionId: mutationSubscriptionId,
          resourceId: mutationResourceId,
          questionKey: mutationQuestionKey,
          reason: reason.trim(),
        });
      } else if (mutationSource === "InferredConnection" || usesInferredConnectionConfirm) {
        const connection = matchedInferredConnection
          ?? findInferredConnection(currentQuestion, inferredConnections);
        if (connection == null || (selectedAnswer !== "Yes" && selectedAnswer !== "No")) {
          throw new Error("The inferred connection for this question is no longer available.");
        }
        if (selectedAnswer === "Yes") {
          await confirmOperatorInferredConnection(snapshotId, { connectionId: connection.connectionId });
        } else {
          await dismissOperatorInferredConnection(snapshotId, { connectionId: connection.connectionId });
        }
      } else {
        const trimmedAnswer = selectedAnswer!.trim();
        await answerSecureNowQuestion(snapshotId, {
          subscriptionId: mutationSubscriptionId,
          resourceId: mutationResourceId,
          questionKey: mutationQuestionKey,
          source: mutationSource!,
          scopeKind: mutationScopeKind!,
          answerCode: trimmedAnswer,
          answerText: trimmedAnswer,
          reason: "Answered in the SecureNow subscription question queue.",
          evidenceFingerprint: mutationEvidenceFingerprint!,
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
    questionsLoaded,
    snapshotId,
  ]);

  const contextValue = useMemo<SecureNowQuestionQueueContextValue>(
    () => ({
      loading,
      questionsLoaded,
      loadError: error !== null,
      openQuestions,
      reviewableQuestions,
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
      currentQuestionMatchesInferredConnection,
      setFilter,
      setDrawerOpen,
      setCurrentIndex,
      setSelectedAnswer,
      setReason,
      setDrawerAction,
      advanceWithoutPersistence,
      beginQuestionReview,
      submitAction,
    }),
    [
      advanceWithoutPersistence,
      beginQuestionReview,
      busy,
      currentIndex,
      currentQuestion,
      currentQuestionMatchesInferredConnection,
      drawerAction,
      drawerOpen,
      filter,
      filteredQuestions,
      loading,
      questionsLoaded,
      error,
      openQuestions,
      reviewableQuestions,
      reason,
      selectedAnswer,
      submitAction,
      visitedQuestionKeys,
    ],
  );

  if (snapshotId.trim().length === 0) {
    // Nested consumers still render while the workbench snapshot is unresolved.
    // Skip queue chrome, but keep context so those hooks do not throw.
    return (
      <SecureNowQuestionQueueContext.Provider value={contextValue}>
        {children}
      </SecureNowQuestionQueueContext.Provider>
    );
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
  "use no memo";

  const value = useContext(SecureNowQuestionQueueContext);

  if (value == null) {
    throw new Error("useSecureNowQuestionQueue must be used within SecureNowQuestionQueueProvider.");
  }

  return value;
}

export function useSecureNowQuestionSubjectNodeId(): string | null {
  "use no memo";

  const { drawerOpen, currentQuestion } = useSecureNowQuestionQueue();
  const resourceId = currentQuestion?.resourceId?.trim() ?? "";

  if (!drawerOpen || resourceId.length === 0) {
    return null;
  }

  return resourceId;
}

export { questionIdentity, VISIT_CAP };
