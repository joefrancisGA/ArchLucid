"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { getConversationMessages } from "@/lib/conversation-api";
import { useConversationThreadsQuery } from "@/hooks/use-conversation-threads-query";
import { buyerAskGroundingLinksForRun } from "@/lib/ask-buyer-grounding-links";
import {
  buildAskCitationActionFollowUps,
  parseAskCitationRefsFromMessageMetadata,
} from "@/lib/ask-citation-action-follow-ups";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { tryStaticDemoConversationMessages } from "@/lib/ask-static-demo-messages";
import { formatConversationListDate, formatConversationListDatePolished } from "@/lib/locale-datetime";
import { resolveContinueLastAskThread } from "@/lib/ask/resolve-continue-last-ask-thread";
import type { ConversationMessage, ConversationThread } from "@/types/conversation";
import { trySeedDemoAskConversation } from "./ask-page-demo-seed";
import { useAskPageStream } from "./use-ask-page-stream";
import { useAskPageUrlSync } from "./use-ask-page-url-sync";

export function useAskPage() {
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [runId, setRunId] = useState("");
  const [baseRunId, setBaseRunId] = useState("");
  const [targetRunId, setTargetRunId] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [listFailure, setListFailure] = useState<ApiLoadFailureState | null>(null);
  const [actionFailure, setActionFailure] = useState<ApiLoadFailureState | null>(null);
  const [retrievalDegraded, setRetrievalDegraded] = useState(false);
  const [lastAskReferencedFindings, setLastAskReferencedFindings] = useState<readonly string[]>([]);
  const [lastAskReferencedDecisions, setLastAskReferencedDecisions] = useState<readonly string[]>([]);
  const [lastAskReferencedArtifacts, setLastAskReferencedArtifacts] = useState<readonly string[]>([]);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const hideCompareChrome =
    isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || buyerPolishedShell;

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

  const stream = useAskPageStream({
    selectedThreadId,
    runId,
    baseRunId,
    targetRunId,
    question,
    setQuestion,
    setSelectedThreadId,
    setMessages,
    setActionFailure,
    setRetrievalDegraded,
    setLastAskReferencedFindings,
    setLastAskReferencedDecisions,
    setLastAskReferencedArtifacts,
    loadThreads,
    loadMessages,
    loading,
    setLoading,
  });

  const urlSync = useAskPageUrlSync({
    runId,
    selectedThreadId,
    baseRunId,
    targetRunId,
    compareOpen,
    setRunId,
    setBaseRunId,
    setTargetRunId,
    setCompareOpen,
    setSelectedThreadId,
    setMessages,
    setRetrievalDegraded,
    setLastAskReferencedFindings,
    setLastAskReferencedDecisions,
    setLastAskReferencedArtifacts,
    threads,
    loadMessages,
  });

  const { onSelectThread } = urlSync;

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

    if (urlSync.urlThreadId.length > 0) {
      return;
    }

    const resumeThreadId = resolveContinueLastAskThread(threads)?.threadId?.trim() ?? "";

    if (resumeThreadId.length === 0) {
      return;
    }

    void onSelectThread(resumeThreadId);
  }, [threads, selectedThreadId, listFailure, onSelectThread, urlSync.urlThreadId]);

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
  const askDisabled = loading || stream.askStreaming || question.trim().length === 0;
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const showPostAssistantFollowUps =
    buyerPolishedShell &&
    lastMessage !== null &&
    lastMessage.role.toLowerCase() === "assistant";

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

  const showThreadHistoryPanel = threads.length > 0;

  return {
    buyerPolishedShell,
    threads,
    selectedThreadId,
    messages,
    runId,
    setRunId,
    baseRunId,
    setBaseRunId: urlSync.setBaseRunIdWithUrl,
    targetRunId,
    setTargetRunId: urlSync.setTargetRunIdWithUrl,
    question,
    setQuestion,
    questionRef: stream.questionRef,
    loading,
    askStreaming: stream.askStreaming,
    compareOpen,
    setCompareOpen: urlSync.setCompareOpenWithUrl,
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
    showRunDeepLinkPrompts: urlSync.showRunDeepLinkPrompts,
    askAssistantGroundingLinks,
    askCitationActionFollowUps,
    streamingAssistantContent: stream.streamingAssistantContent,
    reviewScopedForAsking: urlSync.reviewScopedForAsking,
    showThreadHistoryPanel,
    onPickReviewForAsking: urlSync.onPickReviewForAsking,
    onNewConversation: urlSync.onNewConversation,
    onSelectThread: urlSync.onSelectThread,
    onStarterPromptClick: stream.onStarterPromptClick,
    mergePromptLine: stream.mergePromptLine,
    onAsk: stream.onAsk,
  };
}

export type UseAskPageResult = ReturnType<typeof useAskPage>;
