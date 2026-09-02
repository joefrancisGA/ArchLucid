"use client";

import { useCallback, useRef } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import { useAskStream } from "@/hooks/useAskStream";
import type { ConversationMessage } from "@/types/conversation";

export type UseAskPageStreamOptions = {
  readonly selectedThreadId: string;
  readonly runId: string;
  readonly baseRunId: string;
  readonly targetRunId: string;
  readonly question: string;
  readonly setQuestion: React.Dispatch<React.SetStateAction<string>>;
  readonly setSelectedThreadId: (threadId: string) => void;
  readonly setMessages: React.Dispatch<React.SetStateAction<ConversationMessage[]>>;
  readonly setActionFailure: (failure: ApiLoadFailureState | null) => void;
  readonly setRetrievalDegraded: (value: boolean) => void;
  readonly setLastAskReferencedFindings: (value: readonly string[]) => void;
  readonly setLastAskReferencedDecisions: (value: readonly string[]) => void;
  readonly setLastAskReferencedArtifacts: (value: readonly string[]) => void;
  readonly loadThreads: () => Promise<void>;
  readonly loadMessages: (threadId: string) => Promise<void>;
  readonly loading: boolean;
  readonly setLoading: (loading: boolean) => void;
};

export function useAskPageStream(options: UseAskPageStreamOptions) {
  const {
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
  } = options;

  const {
    tokens: streamingAssistantContent,
    isStreaming: askStreaming,
    ask: askStream,
    reset: resetAskStream,
  } = useAskStream();

  const questionRef = useRef<HTMLTextAreaElement>(null);

  const onAsk = useCallback(
    async (overrideQuestion?: string) => {
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

      resetAskStream();
      setRetrievalDegraded(false);
      setLoading(true);
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
    },
    [
      askStream,
      baseRunId,
      loadMessages,
      loadThreads,
      question,
      resetAskStream,
      runId,
      selectedThreadId,
      setActionFailure,
      setLastAskReferencedArtifacts,
      setLastAskReferencedDecisions,
      setLastAskReferencedFindings,
      setMessages,
      setQuestion,
      setRetrievalDegraded,
      setSelectedThreadId,
      targetRunId,
      setLoading,
    ],
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
  }, [setQuestion]);

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
    [askStreaming, loading, mergePromptLine, onAsk, runId, setQuestion],
  );

  return {
    questionRef,
    askStreaming,
    streamingAssistantContent,
    onAsk,
    mergePromptLine,
    onStarterPromptClick,
  };
}
