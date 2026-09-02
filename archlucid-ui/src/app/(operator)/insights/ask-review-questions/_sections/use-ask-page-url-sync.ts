"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { askReviewQuestionsHref, ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { writeAskContinueLastThreadId } from "@/lib/ask/ask-continue-last-thread-storage";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import type { ConversationMessage, ConversationThread } from "@/types/conversation";

export type UseAskPageUrlSyncOptions = {
  readonly runId: string;
  readonly setRunId: (runId: string) => void;
  readonly setBaseRunId: (runId: string) => void;
  readonly setTargetRunId: (runId: string) => void;
  readonly setCompareOpen: (open: boolean) => void;
  readonly setSelectedThreadId: (threadId: string) => void;
  readonly setMessages: React.Dispatch<React.SetStateAction<ConversationMessage[]>>;
  readonly setRetrievalDegraded: (value: boolean) => void;
  readonly setLastAskReferencedFindings: (value: readonly string[]) => void;
  readonly setLastAskReferencedDecisions: (value: readonly string[]) => void;
  readonly setLastAskReferencedArtifacts: (value: readonly string[]) => void;
  readonly threads: ConversationThread[];
  readonly loadMessages: (threadId: string) => Promise<void>;
};

export function useAskPageUrlSync(options: UseAskPageUrlSyncOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlRunIdRaw = searchParams.get("runId")?.trim() ?? "";

  const {
    runId,
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
  } = options;

  useEffect(() => {
    if (urlRunIdRaw.length === 0) {
      return;
    }

    setRunId(canonicalizeDemoRunId(urlRunIdRaw));
  }, [setRunId, urlRunIdRaw]);

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
    [
      loadMessages,
      router,
      setBaseRunId,
      setCompareOpen,
      setLastAskReferencedArtifacts,
      setLastAskReferencedDecisions,
      setLastAskReferencedFindings,
      setRunId,
      setSelectedThreadId,
      setTargetRunId,
      threads,
      urlRunIdRaw,
    ],
  );

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
  }, [
    router,
    setBaseRunId,
    setCompareOpen,
    setLastAskReferencedArtifacts,
    setLastAskReferencedDecisions,
    setLastAskReferencedFindings,
    setMessages,
    setRetrievalDegraded,
    setRunId,
    setSelectedThreadId,
    setTargetRunId,
  ]);

  const reviewScopedForAsking = urlRunIdRaw.length > 0;

  const showRunDeepLinkPrompts = useMemo(() => {
    if (urlRunIdRaw.length === 0 || runId.trim().length === 0) {
      return false;
    }

    return canonicalizeDemoRunId(urlRunIdRaw) === canonicalizeDemoRunId(runId.trim());
  }, [runId, urlRunIdRaw]);

  return {
    urlRunIdRaw,
    onSelectThread,
    onPickReviewForAsking,
    onNewConversation,
    reviewScopedForAsking,
    showRunDeepLinkPrompts,
  };
}
