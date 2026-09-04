"use client";

import { cn } from "@/lib/utils";

import { AskPageHeaderActions } from "@/app/(operator)/insights/ask-review-questions/_sections/AskPageHeaderActions";
import { AskSourcesOrientationStrip } from "@/app/(operator)/insights/ask-review-questions/_sections/AskSourcesOrientationStrip";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
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
import { ASK_REVIEW_QUESTIONS_CLAIM_DISCIPLINE } from "@/lib/ask-review-questions-evidence-copy";
import {
  ASK_REVIEW_QUESTIONS_FIRST_VIEWPORT_TEST_ID,
  ASK_REVIEW_QUESTIONS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ASK_REVIEW_QUESTIONS_PRIMARY_CONTENT_ID,
  ASK_REVIEW_QUESTIONS_SKIP_LINK_LABEL,
  ASK_REVIEW_QUESTIONS_SKIP_TARGET_ID,
} from "@/lib/ask-review-questions-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

const ASK_PAGE_SUBTITLE =
  "Ask questions across finalized reviews in this workspace, or narrow to one review. Answers cite indexed evidence when available.";

function AskFirstViewportBand(props: {
  readonly ask: ReturnType<typeof useAskPage>;
}): React.ReactElement | null {
  const { ask } = props;

  if (!ask.buyerPolishedShell) {
    return null;
  }

  if (!ask.reviewScopedForAsking) {
    return (
      <div data-testid="ask-review-questions-start-here-panel">
        <AskPickReviewBeforeAskingStrip selectedReviewId="" onSelectReview={ask.onPickReviewForAsking} />
      </div>
    );
  }

  if (ask.showContinueLastThreadRow && ask.continueLastThread !== null) {
    return (
      <AskContinueLastThreadRow
        thread={ask.continueLastThread}
        onResume={(threadId) => {
          void ask.onSelectThread(threadId);
        }}
      />
    );
  }

  return null;
}

export function AskPageContent() {
  const ask = useAskPage();
  const buyerPolishedShell = ask.buyerPolishedShell;

  return (
    <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.sectionStack}>
      {buyerPolishedShell ? (
        <a href={`#${ASK_REVIEW_QUESTIONS_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {ASK_REVIEW_QUESTIONS_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <div
        id={buyerPolishedShell ? ASK_REVIEW_QUESTIONS_PRIMARY_CONTENT_ID : undefined}
        data-testid={buyerPolishedShell ? ASK_REVIEW_QUESTIONS_PRIMARY_CONTENT_ID : undefined}
        className={cn(buyerPolishedShell && "scroll-mt-24", buyerPolishedShell && OPERATOR_LAYOUT.sectionStack)}
      >
        <OperatorPageHeader
          navHref={ASK_REVIEW_QUESTIONS_PATH}
          title={buyerPolishedShell ? BUYER_ASK_PAGE_TITLE : "Ask review questions"}
          headingLevel="h1"
          helpKey="ask-archlucid"
          subtitle={buyerPolishedShell ? BUYER_ASK_PAGE_HERO : ASK_PAGE_SUBTITLE}
          claimDiscipline={buyerPolishedShell ? ASK_REVIEW_QUESTIONS_CLAIM_DISCIPLINE : undefined}
          claimDisciplineTestId={
            buyerPolishedShell ? ASK_REVIEW_QUESTIONS_HEADER_CLAIM_DISCIPLINE_TEST_ID : undefined
          }
          actions={<AskPageHeaderActions />}
        />

        {buyerPolishedShell ? (
          <div
            id={ASK_REVIEW_QUESTIONS_SKIP_TARGET_ID}
            data-testid={ASK_REVIEW_QUESTIONS_FIRST_VIEWPORT_TEST_ID}
            className={cn(
              "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
            <AskFirstViewportBand ask={ask} />
          </div>
        ) : null}

        {buyerPolishedShell ? null : <AskSearchEvidenceVocabularyRail currentSurfaceId="ask" />}
        {buyerPolishedShell ? null : (
          <AskArchitectureIntelligenceVocabularyRail currentSurfaceId="ask-review-questions" />
        )}
        {buyerPolishedShell ? null : <AskVsFrontierAiDifferentiationStrip />}
        {buyerPolishedShell ? null : <PageCapabilityBoundaryStrip surfaceId="ask" />}
        {!buyerPolishedShell && ask.showContinueLastThreadRow && ask.continueLastThread !== null ? (
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

        {!buyerPolishedShell && !ask.reviewScopedForAsking ? (
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

        {buyerPolishedShell ? (
          <div data-testid="ask-review-questions-orientation-bottom">
            <AskSourcesOrientationStrip />
          </div>
        ) : null}
      </div>
    </OperatorPageContainer>
  );
}
