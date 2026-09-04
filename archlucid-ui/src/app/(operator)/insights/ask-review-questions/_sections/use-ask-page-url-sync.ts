"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { askReviewQuestionsHref, ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { writeAskContinueLastThreadId } from "@/lib/ask/ask-continue-last-thread-storage";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  askPageThreadHrefFromSearch,
  parseAskPageCompareOpenFromSearch,
  parseAskPageThreadIdFromSearch,
} from "@/lib/ask/ask-page-thread-url";
import type { ConversationMessage, ConversationThread } from "@/types/conversation";

export type UseAskPageUrlSyncOptions = {
  readonly runId: string;
  readonly selectedThreadId: string;
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
  const pathname = ASK_REVIEW_QUESTIONS_PATH;
  const urlRunIdRaw = searchParams.get("runId")?.trim() ?? "";
  const urlThreadId = parseAskPageThreadIdFromSearch(searchParams.get("thread"));
  const urlCompareOpen = parseAskPageCompareOpenFromSearch(searchParams.get("compare"));

  const {
    runId,
    selectedThreadId,
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

  const syncThreadToUrl = useCallback(
    (threadId: string, compareOpen: boolean) => {
      router.replace(
        askPageThreadHrefFromSearch(searchParams.toString(), { threadId, compareOpen }, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setCompareOpenWithUrl = useCallback(
    (open: boolean) => {
      setCompareOpen(open);
      syncThreadToUrl(selectedThreadId, open);
    },
    [selectedThreadId, setCompareOpen, syncThreadToUrl],
  );

  useEffect(() => {
    if (urlRunIdRaw.length === 0) {
      return;
    }

    setRunId(canonicalizeDemoRunId(urlRunIdRaw));
  }, [setRunId, urlRunIdRaw]);

  useEffect(() => {
    if (urlThreadId.length === 0) {
      return;
    }

    const thread = threads.find((entry) => entry.threadId === urlThreadId);

    if (thread === undefined) {
      return;
    }

    setSelectedThreadId(urlThreadId);
    setCompareOpen(urlCompareOpen);

    if (thread.baseRunId) {
      setBaseRunId(thread.baseRunId);
      setTargetRunId(thread.targetRunId ?? "");
    } else if (!urlCompareOpen) {
      setBaseRunId("");
      setTargetRunId("");
    }

    void loadMessages(urlThreadId);
  }, [
    loadMessages,
    setBaseRunId,
    setCompareOpen,
    setSelectedThreadId,
    setTargetRunId,
    threads,
    urlCompareOpen,
    urlThreadId,
  ]);

  const onSelectThread = useCallback(
    async (threadId: string) => {
      writeAskContinueLastThreadId(threadId);
      setSelectedThreadId(threadId);
      setLastAskReferencedFindings([]);
      setLastAskReferencedDecisions([]);
      setLastAskReferencedArtifacts([]);

      const thread = threads.find((t) => t.threadId === threadId);
      const nextCompareOpen = Boolean(thread?.baseRunId);
      const params = new URLSearchParams(searchParams.toString());

      if (thread?.runId) {
        const canonicalRunId = canonicalizeDemoRunId(thread.runId);
        const scopeRunId =
          urlRunIdRaw.length > 0 ? canonicalizeDemoRunId(urlRunIdRaw) : canonicalRunId;

        params.set("runId", scopeRunId);
        setRunId(scopeRunId);
      } else if (urlRunIdRaw.length === 0) {
        params.delete("runId");
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

      router.replace(
        askPageThreadHrefFromSearch(params.toString(), { threadId, compareOpen: nextCompareOpen }, pathname),
        { scroll: false },
      );
      await loadMessages(threadId);
    },
    [
      loadMessages,
      pathname,
      router,
      searchParams,
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
    syncThreadToUrl("", false);
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
    syncThreadToUrl,
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
    urlThreadId,
    onSelectThread,
    onPickReviewForAsking,
    onNewConversation,
    reviewScopedForAsking,
    showRunDeepLinkPrompts,
    setCompareOpenWithUrl,
  };
}
