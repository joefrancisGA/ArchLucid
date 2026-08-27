"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { askReviewQuestionsHref, ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import { getConversationMessages } from "@/lib/conversation-api";
import { useAskStream } from "@/hooks/useAskStream";
import { useConversationThreadsQuery } from "@/hooks/use-conversation-threads-query";
import { buyerAskGroundingLinksForRun } from "@/lib/ask-buyer-grounding-links";
import {
  buildAskCitationActionFollowUps,
  parseAskCitationRefsFromMessageMetadata,
} from "@/lib/ask-citation-action-follow-ups";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { tryStaticDemoConversationMessages } from "@/lib/ask-static-demo-messages";
import { formatConversationListDate, formatConversationListDatePolished } from "@/lib/locale-datetime";
import { writeAskContinueLastThreadId } from "@/lib/ask/ask-continue-last-thread-storage";
import { resolveContinueLastAskThread } from "@/lib/ask/resolve-continue-last-ask-thread";
import type { ConversationMessage, ConversationThread } from "@/types/conversation";
import { trySeedDemoAskConversation } from "./ask-page-demo-seed";

export function useAskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlRunIdRaw = searchParams.get("runId")?.trim() ?? "";

  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [runId, setRunId] = useState("");
  const [baseRunId, setBaseRunId] = useState("");
  const [targetRunId, setTargetRunId] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const {
    tokens: streamingAssistantContent,
    isStreaming: askStreaming,
    ask: askStream,
    reset: resetAskStream,
  } = useAskStream();
  const [compareOpen, setCompareOpen] = useState(false);
  const [listFailure, setListFailure] = useState<ApiLoadFailureState | null>(null);
  const [actionFailure, setActionFailure] = useState<ApiLoadFailureState | null>(null);
  const [retrievalDegraded, setRetrievalDegraded] = useState(false);
  const [lastAskReferencedFindings, setLastAskReferencedFindings] = useState<readonly string[]>([]);
  const [lastAskReferencedDecisions, setLastAskReferencedDecisions] = useState<readonly string[]>([]);
  const [lastAskReferencedArtifacts, setLastAskReferencedArtifacts] = useState<readonly string[]>([]);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const hideCompareChrome =
    isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || buyerPolishedShell;

  useEffect(() => {
    if (urlRunIdRaw.length === 0) {
      return;
    }

    setRunId(canonicalizeDemoRunId(urlRunIdRaw));
  }, [urlRunIdRaw]);

  const {
    data: prefetchedThreads,
    isError: threadsQueryError,
    refetch: refetchThreads,
  } = useConversationThreadsQuery(50);

  const applyDemoSeedIfAvailable = useCallback((): boolean => {
    if (!isStaticDemoPayloadFallbackEnabled() || buyerPolishedShell) {
      return false;
    }

    const seeded = trySeedDemoAskConversation();

    if (seeded === null) {
      return false;
    }

    setThreads(seeded.threads);
    setSelectedThreadId(seeded.selectedThreadId);
    setMessages(seeded.messages);

    return true;
  }, [buyerPolishedShell]);

  const applyThreadList = useCallback(
    (data: ConversationThread[]) => {
      if (data.length === 0 && applyDemoSeedIfAvailable()) {
        return;
      }

      setThreads(data);
    },
    [applyDemoSeedIfAvailable],
  );

  const loadThreads = useCallback(async () => {
    setListFailure(null);

    try {
      const result = await refetchThreads();
      const data = result.data ?? [];
      applyThreadList(data);
    } catch (e) {
      if (applyDemoSeedIfAvailable()) {
        return;
      }

      setListFailure(toApiLoadFailure(e));
    }
  }, [applyDemoSeedIfAvailable, applyThreadList, refetchThreads]);

  useEffect(() => {
    if (prefetchedThreads === undefined) {
      return;
    }

    if (threadsQueryError) {
      applyDemoSeedIfAvailable();

      return;
    }

    applyThreadList(prefetchedThreads);
  }, [applyDemoSeedIfAvailable, applyThreadList, prefetchedThreads, threadsQueryError]);

  const loadMessages = useCallback(async (threadId: string) => {
    setActionFailure(null);
    try {
      const data = await getConversationMessages(threadId);
      const fallback = tryStaticDemoConversationMessages(threadId);
      setMessages(data.length > 0 ? data : (fallback ?? []));
    } catch (e) {
      const fallback = tryStaticDemoConversationMessages(threadId);

      if (fallback !== null) {
        setMessages(fallback);

        return;
      }

      setActionFailure(toApiLoadFailure(e));
    }
  }, []);

  async function onAsk(overrideQuestion?: string) {
    setActionFailure(null);
    const q = overrideQuestion?.trim() ?? question.trim();
    if (!q) return;

    const rid = runId.trim();
    const tid = selectedThreadId.trim();

    const base = baseRunId.trim();
    const target = targetRunId.trim();
    const useCompare = base.length > 0 && target.length > 0;
    if ((base.length > 0) !== (target.length > 0)) {
      setActionFailure(
        uiFailureFromMessage("Provide both baseline and updated reviews for comparison, or leave both empty."),
      );
      return;
    }

    setLoading(true);
    resetAskStream();
    setRetrievalDegraded(false);
    const pendingUserMessage: ConversationMessage = {
      messageId: `pending-user-${Date.now()}`,
      threadId: tid || "pending",
      role: "User",
      content: q,
      createdUtc: new Date().toISOString(),
      metadataJson: "{}",
    };
    setMessages((previous) => [...previous, pendingUserMessage]);

    try {
      const { response: result, error: streamError } = await askStream({
        threadId: tid || undefined,
        runId: rid || undefined,
        question: q,
        baseRunId: useCompare ? base : undefined,
        targetRunId: useCompare ? target : undefined,
      });

      if (result === null) {
        setMessages((previous) => previous.filter((m) => m.messageId !== pendingUserMessage.messageId));
        setActionFailure(
          uiFailureFromMessage(streamError ?? "Ask stream did not complete. Try again or check your connection."),
        );

        return;
      }

      setSelectedThreadId(result.threadId);
      setRetrievalDegraded(result.retrievalDegraded === true);
      setLastAskReferencedFindings(result.referencedFindings ?? []);
      setLastAskReferencedDecisions(result.referencedDecisions ?? []);
      setLastAskReferencedArtifacts(result.referencedArtifacts ?? []);
      setQuestion("");
      await loadThreads();
      await loadMessages(result.threadId);
    } catch (e) {
      resetAskStream();
      setMessages((previous) => previous.filter((m) => m.messageId !== pendingUserMessage.messageId));
      setActionFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
      resetAskStream();
    }
  }

  const onSelectThread = useCallback(
    async (threadId: string) => {
      writeAskContinueLastThreadId(threadId);
      setSelectedThreadId(threadId);
      setLastAskReferencedFindings([]);
      setLastAskReferencedDecisions([]);
      setLastAskReferencedArtifacts([]);

      const thread = threads.find((t) => t.threadId === threadId);

      if (thread?.runId) {
        const canonicalRunId = canonicalizeDemoRunId(thread.runId);
        const scopeRunId =
          urlRunIdRaw.length > 0 ? canonicalizeDemoRunId(urlRunIdRaw) : canonicalRunId;

        router.replace(askReviewQuestionsHref({ runId: scopeRunId }), { scroll: false });
        setRunId(scopeRunId);
      } else if (urlRunIdRaw.length === 0) {
        setRunId("");
      }

      if (thread?.baseRunId) {
        setBaseRunId(thread.baseRunId);
        setTargetRunId(thread.targetRunId ?? "");
        setCompareOpen(true);
      } else {
        setBaseRunId("");
        setTargetRunId("");
        setCompareOpen(false);
      }

      await loadMessages(threadId);
    },
    [threads, loadMessages, router, urlRunIdRaw],
  );

  const mergePromptLine = useCallback((line: string) => {
    const addition = line.trim();

    if (addition.length === 0) {
      return;
    }

    setQuestion((previous) => {
      const prior = previous.trim();

      if (prior.length === 0) {
        return addition;
      }

      if (prior.includes(addition)) {
        return prior;
      }

      return `${prior}\n\n${addition}`;
    });

    requestAnimationFrame(() => {
      questionRef.current?.focus();
    });
  }, []);

  const onStarterPromptClick = useCallback(
    (line: string) => {
      const trimmed = line.trim();

      if (trimmed.length === 0) {
        return;
      }

      if (!loading && !askStreaming && runId.trim().length > 0) {
        setQuestion(trimmed);
        void onAsk(trimmed);

        return;
      }

      mergePromptLine(trimmed);
    },
    [askStreaming, loading, mergePromptLine, runId],
  );

  useEffect(() => {
    if (listFailure !== null) {
      return;
    }

    if (!Array.isArray(threads) || threads.length === 0) {
      return;
    }

    if (selectedThreadId.trim().length > 0) {
      return;
    }

    const resumeThreadId = resolveContinueLastAskThread(threads)?.threadId?.trim() ?? "";

    if (resumeThreadId.length === 0) {
      return;
    }

    void onSelectThread(resumeThreadId);
  }, [threads, selectedThreadId, listFailure, onSelectThread]);

  const continueLastThread = useMemo(() => resolveContinueLastAskThread(threads), [threads]);
  const showContinueLastThreadRow =
    continueLastThread !== null &&
    continueLastThread.threadId.trim() !== selectedThreadId.trim() &&
    threads.length > 0;

  const threadSelected = selectedThreadId.trim().length > 0;
  const runAnchorUnset = !threadSelected && runId.trim().length === 0;
  const listDateFormatter = isBuyerPolishedOperatorShellEnv()
    ? formatConversationListDatePolished
    : formatConversationListDate;
  const askDisabled = loading || askStreaming || question.trim().length === 0;
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const showPostAssistantFollowUps =
    buyerPolishedShell &&
    lastMessage !== null &&
    lastMessage.role.toLowerCase() === "assistant";
  const showRunDeepLinkPrompts = useMemo(() => {
    if (urlRunIdRaw.length === 0 || runId.trim().length === 0) {
      return false;
    }

    return canonicalizeDemoRunId(urlRunIdRaw) === canonicalizeDemoRunId(runId.trim());
  }, [urlRunIdRaw, runId]);

  const askAssistantGroundingLinks = useMemo(
    () => (buyerPolishedShell ? buyerAskGroundingLinksForRun(runId) : null),
    [buyerPolishedShell, runId],
  );

  const askCitationActionFollowUps = useMemo(() => {
    const trailing = messages.length > 0 ? messages[messages.length - 1] : null;
    const fromMetadata =
      trailing !== null && trailing.role.toLowerCase() === "assistant"
        ? parseAskCitationRefsFromMessageMetadata(trailing.metadataJson)
        : null;

    return buildAskCitationActionFollowUps({
      runId,
      referencedFindings:
        lastAskReferencedFindings.length > 0
          ? lastAskReferencedFindings
          : (fromMetadata?.referencedFindings ?? []),
      referencedDecisions:
        lastAskReferencedDecisions.length > 0
          ? lastAskReferencedDecisions
          : (fromMetadata?.referencedDecisions ?? []),
      referencedArtifacts:
        lastAskReferencedArtifacts.length > 0
          ? lastAskReferencedArtifacts
          : (fromMetadata?.referencedArtifacts ?? []),
      groundingLinks: askAssistantGroundingLinks,
    });
  }, [
    askAssistantGroundingLinks,
    lastAskReferencedArtifacts,
    lastAskReferencedDecisions,
    lastAskReferencedFindings,
    messages,
    runId,
  ]);

  const onPickReviewForAsking = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      router.replace(askReviewQuestionsHref({ runId: trimmed }), { scroll: false });
    },
    [router],
  );

  const reviewScopedForAsking = urlRunIdRaw.length > 0;

  const onNewConversation = useCallback(() => {
    setSelectedThreadId("");
    setMessages([]);
    setRetrievalDegraded(false);
    setLastAskReferencedFindings([]);
    setLastAskReferencedDecisions([]);
    setLastAskReferencedArtifacts([]);
    setRunId("");
    setBaseRunId("");
    setTargetRunId("");
    setCompareOpen(false);
    router.replace(ASK_REVIEW_QUESTIONS_PATH, { scroll: false });
  }, [router]);

  const showThreadHistoryPanel = threads.length > 0;

  return {
    buyerPolishedShell,
    threads,
    selectedThreadId,
    messages,
    runId,
    setRunId,
    baseRunId,
    setBaseRunId,
    targetRunId,
    setTargetRunId,
    question,
    setQuestion,
    questionRef,
    loading,
    askStreaming,
    compareOpen,
    setCompareOpen,
    listFailure,
    actionFailure,
    retrievalDegraded,
    hideCompareChrome,
    continueLastThread,
    showContinueLastThreadRow,
    threadSelected,
    runAnchorUnset,
    listDateFormatter,
    askDisabled,
    showPostAssistantFollowUps,
    showRunDeepLinkPrompts,
    askAssistantGroundingLinks,
    askCitationActionFollowUps,
    streamingAssistantContent,
    reviewScopedForAsking,
    showThreadHistoryPanel,
    onPickReviewForAsking,
    onNewConversation,
    onSelectThread,
    onStarterPromptClick,
    mergePromptLine,
    onAsk,
  };
}

export type UseAskPageResult = ReturnType<typeof useAskPage>;
