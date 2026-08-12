"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import { getConversationMessages } from "@/lib/conversation-api";
import { useAskStream } from "@/hooks/useAskStream";
import { useAskReviewAvailability } from "@/hooks/useAskReviewAvailability";
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
import { BUYER_ASK_PAGE_HERO, BUYER_ASK_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { ConversationMessage, ConversationThread } from "@/types/conversation";
import { AskMainPanel } from "@/app/(operator)/insights/ask-review-questions/_sections/AskMainPanel";
import { AskNoReviewEmptyState } from "@/app/(operator)/insights/ask-review-questions/_sections/AskNoReviewEmptyState";
import { AskArchitectureIntelligenceVocabularyRail } from "@/components/AskArchitectureIntelligenceVocabularyRail";
import { AskSearchEvidenceVocabularyRail } from "@/components/AskSearchEvidenceVocabularyRail";
import { AskVsFrontierAiDifferentiationStrip } from "@/components/ask/AskVsFrontierAiDifferentiationStrip";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { AskThreadHistoryPanel } from "@/app/(operator)/insights/ask-review-questions/_sections/AskThreadHistoryPanel";
const ASK_PAGE_SUBTITLE =
  "Ask questions about a finalized review. Answers use the signed review record and cite evidence when available.";

export function AskPageContent() {
  const searchParams = useSearchParams();
  const urlRunIdRaw = searchParams.get("runId")?.trim() ?? "";

  const workspaceRun = useWorkspaceActiveRun();
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [runId, setRunId] = useState("");
  const [baseRunId, setBaseRunId] = useState("");
  const [targetRunId, setTargetRunId] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const { loading: reviewsLoading, hasSelectableReviews } = useAskReviewAvailability();
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

  useEffect(() => {
    if (!buyerPolishedShell) {
      return;
    }

    if (urlRunIdRaw.length > 0) {
      return;
    }

    const fromWs = workspaceRun?.activeRunId?.trim() ?? "";

    if (fromWs.length === 0) {
      return;
    }

    if (selectedThreadId.trim().length > 0) {
      return;
    }

    setRunId(canonicalizeDemoRunId(fromWs));
  }, [buyerPolishedShell, workspaceRun?.activeRunId, selectedThreadId, urlRunIdRaw]);

  const {
    data: prefetchedThreads,
    isError: threadsQueryError,
    refetch: refetchThreads,
  } = useConversationThreadsQuery(50);

  const applyThreadList = useCallback(
    (data: ConversationThread[]) => {
      if (data.length === 0 && isStaticDemoPayloadFallbackEnabled() && !buyerPolishedShell) {
        const seeded = tryStaticDemoConversationMessages("thread-claims-intake-001");

        if (seeded !== null) {
          setThreads([
            {
              threadId: "thread-claims-intake-001",
              tenantId: "demo",
              workspaceId: "demo",
              projectId: "default",
              runId: SHOWCASE_STATIC_DEMO_RUN_ID,
              title: "Review briefing thread",
              createdUtc: "2026-01-12T10:06:00.000Z",
              lastUpdatedUtc: "2026-01-12T10:06:12.000Z",
            },
          ]);
          setSelectedThreadId("thread-claims-intake-001");
          setRunId(SHOWCASE_STATIC_DEMO_RUN_ID);
          setMessages(seeded);

          return;
        }
      }

      setThreads(data);
    },
    [buyerPolishedShell],
  );

  const loadThreads = useCallback(async () => {
    setListFailure(null);

    try {
      const result = await refetchThreads();
      const data = result.data ?? [];
      applyThreadList(data);
    } catch (e) {
      if (isStaticDemoPayloadFallbackEnabled() && !buyerPolishedShell) {
        const seeded = tryStaticDemoConversationMessages("thread-claims-intake-001");

        if (seeded !== null) {
          setThreads([
            {
              threadId: "thread-claims-intake-001",
              tenantId: "demo",
              workspaceId: "demo",
              projectId: "default",
              runId: SHOWCASE_STATIC_DEMO_RUN_ID,
              title: "Review briefing thread",
              createdUtc: "2026-01-12T10:06:00.000Z",
              lastUpdatedUtc: "2026-01-12T10:06:12.000Z",
            },
          ]);
          setSelectedThreadId("thread-claims-intake-001");
          setRunId(SHOWCASE_STATIC_DEMO_RUN_ID);
          setMessages(seeded);

          return;
        }
      }

      setListFailure(toApiLoadFailure(e));
    }
  }, [applyThreadList, buyerPolishedShell, refetchThreads]);

  useEffect(() => {
    if (prefetchedThreads === undefined) {
      return;
    }

    if (threadsQueryError) {
      if (isStaticDemoPayloadFallbackEnabled() && !buyerPolishedShell) {
        const seeded = tryStaticDemoConversationMessages("thread-claims-intake-001");

        if (seeded !== null) {
          setThreads([
            {
              threadId: "thread-claims-intake-001",
              tenantId: "demo",
              workspaceId: "demo",
              projectId: "default",
              runId: SHOWCASE_STATIC_DEMO_RUN_ID,
              title: "Review briefing thread",
              createdUtc: "2026-01-12T10:06:00.000Z",
              lastUpdatedUtc: "2026-01-12T10:06:12.000Z",
            },
          ]);
          setSelectedThreadId("thread-claims-intake-001");
          setRunId(SHOWCASE_STATIC_DEMO_RUN_ID);
          setMessages(seeded);
        }
      }

      return;
    }

    applyThreadList(prefetchedThreads);
  }, [applyThreadList, buyerPolishedShell, prefetchedThreads, threadsQueryError]);

  useEffect(() => {
    const fromWorkspace = workspaceRun?.activeRunId?.trim() ?? "";

    if (fromWorkspace.length === 0) {
      return;
    }

    if (selectedThreadId.trim().length > 0) {
      return;
    }

    setRunId(canonicalizeDemoRunId(fromWorkspace));
  }, [workspaceRun?.activeRunId, selectedThreadId]);

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

  async function onAsk() {
    setActionFailure(null);
    const q = question.trim();
    if (!q) return;

    const rid = runId.trim();
    const tid = selectedThreadId.trim();
    if (!tid && !rid) {
      setActionFailure(
        uiFailureFromMessage("Select an architecture review to start asking questions, or open an existing conversation."),
      );
      return;
    }

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
      setSelectedThreadId(threadId);
      setLastAskReferencedFindings([]);
      setLastAskReferencedDecisions([]);
      setLastAskReferencedArtifacts([]);

      const thread = threads.find((t) => t.threadId === threadId);

      if (thread?.runId) {
        setRunId(canonicalizeDemoRunId(thread.runId));
      } else {
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
    [threads, loadMessages],
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

    const firstThreadId = threads[0]?.threadId?.trim() ?? "";

    if (firstThreadId.length === 0) {
      return;
    }

    void onSelectThread(firstThreadId);
  }, [threads, selectedThreadId, listFailure, onSelectThread]);

  const threadSelected = selectedThreadId.trim().length > 0;
  const needsRunForNewThread = !threadSelected;
  const runMissing = needsRunForNewThread && runId.trim().length === 0;
  const listDateFormatter = isBuyerPolishedOperatorShellEnv()
    ? formatConversationListDatePolished
    : formatConversationListDate;
  const askDisabled = loading || askStreaming || question.trim().length === 0 || runMissing;
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

  const onNewConversation = useCallback(() => {
    setSelectedThreadId("");
    setMessages([]);
    setRetrievalDegraded(false);
    setLastAskReferencedFindings([]);
    setLastAskReferencedDecisions([]);
    setLastAskReferencedArtifacts([]);

    if (buyerPolishedShell) {
      const fromWs = workspaceRun?.activeRunId?.trim() ?? "";

      setRunId(fromWs.length > 0 ? canonicalizeDemoRunId(fromWs) : SHOWCASE_STATIC_DEMO_RUN_ID);
    } else {
      setRunId("");
    }
  }, [buyerPolishedShell, workspaceRun?.activeRunId]);

  const showNoReviewEmptyState =
    !reviewsLoading &&
    !hasSelectableReviews &&
    threads.length === 0 &&
    selectedThreadId.trim().length === 0;
  const showThreadHistoryPanel = threads.length > 0;

  return (
    <div className="max-w-5xl">
      <OperatorPageHeader
        title={buyerPolishedShell ? BUYER_ASK_PAGE_TITLE : "Ask review questions"}
        helpKey="ask-archlucid"
        subtitle={buyerPolishedShell ? BUYER_ASK_PAGE_HERO : ASK_PAGE_SUBTITLE}
        actions={<PageContextualHelpButton />}
      />
      <AskSearchEvidenceVocabularyRail currentSurfaceId="ask" />
      <AskArchitectureIntelligenceVocabularyRail currentSurfaceId="ask-review-questions" />
      <AskVsFrontierAiDifferentiationStrip />
      <PageCapabilityBoundaryStrip surfaceId="ask" />
{listFailure !== null ? (
        <div role="alert" className="mb-4">
          <OperatorApiProblem
            problem={listFailure.problem}
            fallbackMessage={listFailure.message}
            correlationId={listFailure.correlationId}
          />
        </div>
      ) : null}

      {reviewsLoading ? null : showNoReviewEmptyState ? (
        <AskNoReviewEmptyState />
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-4",
            showThreadHistoryPanel && "md:grid-cols-[minmax(180px,220px)_1fr]",
          )}
        >
          {showThreadHistoryPanel ? (
            <AskThreadHistoryPanel
              buyerPolishedShell={buyerPolishedShell}
              runId={runId}
              threads={threads}
              selectedThreadId={selectedThreadId}
              listDateFormatter={listDateFormatter}
              onNewConversation={onNewConversation}
              onSelectThread={onSelectThread}
            />
          ) : null}

          <AskMainPanel
            runId={runId}
            onRunIdChange={setRunId}
            selectedThreadId={selectedThreadId}
            buyerPolishedShell={buyerPolishedShell}
            hideCompareChrome={hideCompareChrome}
            compareOpen={compareOpen}
            onCompareOpenChange={setCompareOpen}
            baseRunId={baseRunId}
            onBaseRunIdChange={setBaseRunId}
            targetRunId={targetRunId}
            onTargetRunIdChange={setTargetRunId}
            questionRef={questionRef}
            question={question}
            onQuestionChange={setQuestion}
            showRunDeepLinkPrompts={showRunDeepLinkPrompts}
            runMissing={runMissing}
            onMergePromptLine={mergePromptLine}
            loading={loading || askStreaming}
            askDisabled={askDisabled}
            onAsk={onAsk}
            actionFailure={actionFailure}
            messages={messages}
            streamingAssistantContent={streamingAssistantContent.length > 0 ? streamingAssistantContent : null}
            askAssistantGroundingLinks={askAssistantGroundingLinks}
            askCitationActionFollowUps={askCitationActionFollowUps}
            showPostAssistantFollowUps={showPostAssistantFollowUps}
            retrievalDegraded={retrievalDegraded}
          />
        </div>
      )}
    </div>
  );
}
