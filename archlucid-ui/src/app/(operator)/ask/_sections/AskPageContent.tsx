"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import { askArchLucidStream, getConversationMessages, listConversationThreads } from "@/lib/conversation-api";
import { buyerAskGroundingLinksForRun } from "@/lib/ask-buyer-grounding-links";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { tryStaticDemoConversationMessages } from "@/lib/ask-static-demo-messages";
import { formatConversationListDate, formatConversationListDatePolished } from "@/lib/locale-datetime";
import { BUYER_ASK_PAGE_TITLE } from "@/lib/buyer-polish-copy";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer-facing-review-title";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { ConversationMessage, ConversationThread } from "@/types/conversation";
import { AskContextParagraph } from "@/app/(operator)/ask/_sections/AskContextParagraph";
import { AskMainPanel } from "@/app/(operator)/ask/_sections/AskMainPanel";
import { AskThreadHistoryPanel } from "@/app/(operator)/ask/_sections/AskThreadHistoryPanel";

export function AskPageContent() {
  const searchParams = useSearchParams();
  const urlRunIdRaw = searchParams.get("runId")?.trim() ?? "";

  const workspaceRun = useWorkspaceActiveRun();
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [runId, setRunId] = useState(SHOWCASE_STATIC_DEMO_RUN_ID);
  const [baseRunId, setBaseRunId] = useState("");
  const [targetRunId, setTargetRunId] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingAssistantContent, setStreamingAssistantContent] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [listFailure, setListFailure] = useState<ApiLoadFailureState | null>(null);
  const [actionFailure, setActionFailure] = useState<ApiLoadFailureState | null>(null);
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

  const loadThreads = useCallback(async () => {
    setListFailure(null);

    try {
      const data = await listConversationThreads();
      setThreads(data);

      if (data.length === 0 && (isBuyerPolishedOperatorShellEnv() || isStaticDemoPayloadFallbackEnabled())) {
        const seeded = tryStaticDemoConversationMessages("thread-claims-intake-001");

        if (seeded !== null) {
          setThreads([
            {
              threadId: "thread-claims-intake-001",
              tenantId: "demo",
              workspaceId: "demo",
              projectId: "default",
              runId: SHOWCASE_STATIC_DEMO_RUN_ID,
              title: "Example review question — PHI risk briefing",
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
    } catch (e) {
      if (isBuyerPolishedOperatorShellEnv() || isStaticDemoPayloadFallbackEnabled()) {
        const seeded = tryStaticDemoConversationMessages("thread-claims-intake-001");

        if (seeded !== null) {
          setThreads([
            {
              threadId: "thread-claims-intake-001",
              tenantId: "demo",
              workspaceId: "demo",
              projectId: "default",
              runId: SHOWCASE_STATIC_DEMO_RUN_ID,
              title: "Example review question — PHI risk briefing",
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
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

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
    setStreamingAssistantContent("");
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
      const result = await askArchLucidStream(
        {
          threadId: tid || undefined,
          runId: rid || undefined,
          question: q,
          baseRunId: useCompare ? base : undefined,
          targetRunId: useCompare ? target : undefined,
        },
        {
          onToken: (text) => {
            setStreamingAssistantContent((previous) => (previous ?? "") + text);
          },
          onDone: (response) => {
            setSelectedThreadId(response.threadId);
            setStreamingAssistantContent(null);
          },
          onError: (detail) => {
            setStreamingAssistantContent(null);
            setActionFailure(uiFailureFromMessage(detail));
          },
        },
      );

      if (result === null) {
        setMessages((previous) => previous.filter((m) => m.messageId !== pendingUserMessage.messageId));

        return;
      }

      setQuestion("");
      await loadThreads();
      await loadMessages(result.threadId);
    } catch (e) {
      setStreamingAssistantContent(null);
      setMessages((previous) => previous.filter((m) => m.messageId !== pendingUserMessage.messageId));
      setActionFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
      setStreamingAssistantContent(null);
    }
  }

  const onSelectThread = useCallback(
    async (threadId: string) => {
      setSelectedThreadId(threadId);

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

    if (threads.length === 0) {
      return;
    }

    if (selectedThreadId.trim().length > 0) {
      return;
    }

    void onSelectThread(threads[0]!.threadId);
  }, [threads, selectedThreadId, listFailure, onSelectThread]);

  const threadSelected = selectedThreadId.trim().length > 0;
  const needsRunForNewThread = !threadSelected;
  const runMissing = needsRunForNewThread && runId.trim().length === 0;
  const listDateFormatter = isBuyerPolishedOperatorShellEnv()
    ? formatConversationListDatePolished
    : formatConversationListDate;
  const askDisabled = loading || question.trim().length === 0 || runMissing;
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

  const onNewConversation = useCallback(() => {
    setSelectedThreadId("");
    setMessages([]);

    if (buyerPolishedShell) {
      const fromWs = workspaceRun?.activeRunId?.trim() ?? "";

      setRunId(fromWs.length > 0 ? canonicalizeDemoRunId(fromWs) : SHOWCASE_STATIC_DEMO_RUN_ID);
    }
  }, [buyerPolishedShell, workspaceRun?.activeRunId]);

  return (
    <div className="max-w-5xl">
      <OperatorPageHeader
        title={buyerPolishedShell ? BUYER_ASK_PAGE_TITLE : "Ask about a review"}
        helpKey="ask-archlucid"
        subtitle={
          buyerPolishedShell ? undefined : "Conversations stay in your workspace. Select an architecture review for a new conversation; follow-ups stay on the same conversation without picking the review again."
        }
      />
      {buyerPolishedShell ? (
        <p
          className="mb-2 rounded-md border border-teal-200/80 bg-teal-50/70 px-3 py-2 text-sm font-medium text-teal-950 dark:border-teal-900 dark:bg-teal-950/35 dark:text-teal-50"
          data-testid="ask-buyer-scope-banner"
        >
          Scoped to {buyerFacingReviewLinkLabelFromRunId(runId.trim())}
        </p>
      ) : null}
      <AskContextParagraph buyerPolishedShell={buyerPolishedShell} runId={runId} />

      {listFailure !== null ? (
        <div role="alert" className="mb-4">
          <OperatorApiProblem
            problem={listFailure.problem}
            fallbackMessage={listFailure.message}
            correlationId={listFailure.correlationId}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(220px,280px)_1fr]">
        <AskThreadHistoryPanel
          buyerPolishedShell={buyerPolishedShell}
          runId={runId}
          threads={threads}
          selectedThreadId={selectedThreadId}
          listDateFormatter={listDateFormatter}
          onNewConversation={onNewConversation}
          onSelectThread={onSelectThread}
        />

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
          loading={loading}
          askDisabled={askDisabled}
          onAsk={onAsk}
          actionFailure={actionFailure}
          messages={messages}
          streamingAssistantContent={streamingAssistantContent}
          askAssistantGroundingLinks={askAssistantGroundingLinks}
          showPostAssistantFollowUps={showPostAssistantFollowUps}
        />
      </div>
    </div>
  );
}
