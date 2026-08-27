"use client";

import { cn } from "@/lib/utils";

import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { BUYER_ASK_PAGE_HERO, BUYER_ASK_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { AskMainPanel } from "@/app/(operator)/insights/ask-review-questions/_sections/AskMainPanel";
import { AskArchitectureIntelligenceVocabularyRail } from "@/components/AskArchitectureIntelligenceVocabularyRail";
import { AskSearchEvidenceVocabularyRail } from "@/components/AskSearchEvidenceVocabularyRail";
import { AskPickReviewBeforeAskingStrip } from "@/components/ask/AskPickReviewBeforeAskingStrip";
import { AskVsFrontierAiDifferentiationStrip } from "@/components/ask/AskVsFrontierAiDifferentiationStrip";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { AskThreadHistoryPanel } from "@/app/(operator)/insights/ask-review-questions/_sections/AskThreadHistoryPanel";
import { AskContinueLastThreadRow } from "@/app/(operator)/insights/ask-review-questions/_sections/AskContinueLastThreadRow";
import { AskNextReviewFooterClient } from "@/app/(operator)/insights/ask-review-questions/_sections/AskNextReviewFooterClient";
import { useAskPage } from "@/app/(operator)/insights/ask-review-questions/_sections/use-ask-page";

const ASK_PAGE_SUBTITLE =
  "Ask questions across finalized reviews in this workspace, or narrow to one review. Answers cite indexed evidence when available.";

export function AskPageContent() {
  const ask = useAskPage();

  return (
    <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.sectionStack}>
      <OperatorPageHeader
        navHref={ASK_REVIEW_QUESTIONS_PATH}
        title={ask.buyerPolishedShell ? BUYER_ASK_PAGE_TITLE : "Ask review questions"}
        helpKey="ask-archlucid"
        subtitle={ask.buyerPolishedShell ? BUYER_ASK_PAGE_HERO : ASK_PAGE_SUBTITLE}
        actions={<PageContextualHelpButton />}
      />
      <AskSearchEvidenceVocabularyRail currentSurfaceId="ask" />
      <AskArchitectureIntelligenceVocabularyRail currentSurfaceId="ask-review-questions" />
      <AskVsFrontierAiDifferentiationStrip />
      <PageCapabilityBoundaryStrip surfaceId="ask" />
      {ask.showContinueLastThreadRow && ask.continueLastThread !== null ? (
        <AskContinueLastThreadRow
          thread={ask.continueLastThread}
          onResume={(threadId) => {
            void ask.onSelectThread(threadId);
          }}
        />
      ) : null}
      {ask.listFailure !== null ? (
        <div role="alert" className="mb-4">
          <OperatorApiProblem
            problem={ask.listFailure.problem}
            fallbackMessage={ask.listFailure.message}
            correlationId={ask.listFailure.correlationId}
          />
        </div>
      ) : null}

      {!ask.reviewScopedForAsking ? (
        <AskPickReviewBeforeAskingStrip selectedReviewId="" onSelectReview={ask.onPickReviewForAsking} />
      ) : null}

      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          ask.showThreadHistoryPanel && "md:grid-cols-[minmax(180px,220px)_1fr]",
        )}
      >
        {ask.showThreadHistoryPanel ? (
          <AskThreadHistoryPanel
            buyerPolishedShell={ask.buyerPolishedShell}
            runId={ask.runId}
            threads={ask.threads}
            selectedThreadId={ask.selectedThreadId}
            listDateFormatter={ask.listDateFormatter}
            onNewConversation={ask.onNewConversation}
            onSelectThread={ask.onSelectThread}
          />
        ) : null}

        {ask.reviewScopedForAsking ? (
          <AskMainPanel
            runId={ask.runId}
            onRunIdChange={ask.setRunId}
            hideRunPicker
            clearScopeHref={ASK_REVIEW_QUESTIONS_PATH}
            selectedThreadId={ask.selectedThreadId}
            buyerPolishedShell={ask.buyerPolishedShell}
            hideCompareChrome={ask.hideCompareChrome}
            compareOpen={ask.compareOpen}
            onCompareOpenChange={ask.setCompareOpen}
            baseRunId={ask.baseRunId}
            onBaseRunIdChange={ask.setBaseRunId}
            targetRunId={ask.targetRunId}
            onTargetRunIdChange={ask.setTargetRunId}
            questionRef={ask.questionRef}
            question={ask.question}
            onQuestionChange={ask.setQuestion}
            showRunDeepLinkPrompts={ask.showRunDeepLinkPrompts}
            runAnchorUnset={ask.runAnchorUnset}
            onMergePromptLine={ask.mergePromptLine}
            onStarterPromptClick={ask.onStarterPromptClick}
            loading={ask.loading || ask.askStreaming}
            askDisabled={ask.askDisabled}
            onAsk={ask.onAsk}
            actionFailure={ask.actionFailure}
            messages={ask.messages}
            streamingAssistantContent={
              ask.streamingAssistantContent.length > 0 ? ask.streamingAssistantContent : null
            }
            askAssistantGroundingLinks={ask.askAssistantGroundingLinks}
            askCitationActionFollowUps={ask.askCitationActionFollowUps}
            showPostAssistantFollowUps={ask.showPostAssistantFollowUps}
            retrievalDegraded={ask.retrievalDegraded}
          />
        ) : null}
      </div>

      {ask.runId.trim().length > 0 ? <AskNextReviewFooterClient runId={ask.runId.trim()} /> : null}
    </OperatorPageContainer>
  );
}
