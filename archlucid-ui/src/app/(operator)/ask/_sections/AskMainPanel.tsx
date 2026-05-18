import type { RefObject } from "react";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Card, CardContent } from "@/components/ui/card";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { BuyerAskGroundingLink } from "@/lib/ask-buyer-grounding-links";
import type { ConversationMessage } from "@/types/conversation";
import { AskBuyerRunAnchors } from "@/app/(operator)/ask/_sections/AskBuyerRunAnchors";
import { AskCompareReviewsCollapsible } from "@/app/(operator)/ask/_sections/AskCompareReviewsCollapsible";
import { AskMessageThreadPanel } from "@/app/(operator)/ask/_sections/AskMessageThreadPanel";
import { AskQuestionForm } from "@/app/(operator)/ask/_sections/AskQuestionForm";

export type AskMainPanelProps = {
  runId: string;
  onRunIdChange: (value: string) => void;
  selectedThreadId: string;
  buyerPolishedShell: boolean;
  hideCompareChrome: boolean;
  compareOpen: boolean;
  onCompareOpenChange: (open: boolean) => void;
  baseRunId: string;
  onBaseRunIdChange: (value: string) => void;
  targetRunId: string;
  onTargetRunIdChange: (value: string) => void;
  questionRef: RefObject<HTMLTextAreaElement | null>;
  question: string;
  onQuestionChange: (value: string) => void;
  showRunDeepLinkPrompts: boolean;
  runMissing: boolean;
  onMergePromptLine: (line: string) => void;
  loading: boolean;
  askDisabled: boolean;
  onAsk: () => void;
  actionFailure: ApiLoadFailureState | null;
  messages: ConversationMessage[];
  askAssistantGroundingLinks: readonly BuyerAskGroundingLink[] | null;
  showPostAssistantFollowUps: boolean;
};

export function AskMainPanel(props: AskMainPanelProps) {
  const {
    runId,
    onRunIdChange,
    selectedThreadId,
    buyerPolishedShell,
    hideCompareChrome,
    compareOpen,
    onCompareOpenChange,
    baseRunId,
    onBaseRunIdChange,
    targetRunId,
    onTargetRunIdChange,
    questionRef,
    question,
    onQuestionChange,
    showRunDeepLinkPrompts,
    runMissing,
    onMergePromptLine,
    loading,
    askDisabled,
    onAsk,
    actionFailure,
    messages,
    askAssistantGroundingLinks,
    showPostAssistantFollowUps,
  } = props;

  const messageThreadPanel = (
    <AskMessageThreadPanel
      buyerPolishedShell={buyerPolishedShell}
      selectedThreadId={selectedThreadId}
      messages={messages}
      askAssistantGroundingLinks={askAssistantGroundingLinks}
      showPostAssistantFollowUps={showPostAssistantFollowUps}
      runMissing={runMissing}
      onMergePromptLine={onMergePromptLine}
    />
  );

  return (
    <Card className="border-neutral-200 dark:border-neutral-700">
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-3">
          <AskRunIdPicker
            value={runId}
            onChange={onRunIdChange}
            selectedThreadId={selectedThreadId}
            fieldId="ask-run-primary"
          />
          <AskBuyerRunAnchors buyerPolishedShell={buyerPolishedShell} runId={runId} />
          {hideCompareChrome ? null : (
            <AskCompareReviewsCollapsible
              buyerPolishedShell={buyerPolishedShell}
              compareOpen={compareOpen}
              onCompareOpenChange={onCompareOpenChange}
              selectedThreadId={selectedThreadId}
              baseRunId={baseRunId}
              onBaseRunIdChange={onBaseRunIdChange}
              targetRunId={targetRunId}
              onTargetRunIdChange={onTargetRunIdChange}
            />
          )}
        </div>

        {actionFailure !== null ? (
          <div role="alert" className="pt-0">
            <OperatorApiProblem
              problem={actionFailure.problem}
              fallbackMessage={actionFailure.message}
              correlationId={actionFailure.correlationId}
            />
          </div>
        ) : null}

        {buyerPolishedShell ? messageThreadPanel : null}

        <AskQuestionForm
          questionRef={questionRef}
          question={question}
          onQuestionChange={onQuestionChange}
          buyerPolishedShell={buyerPolishedShell}
          showRunDeepLinkPrompts={showRunDeepLinkPrompts}
          runMissing={runMissing}
          onMergePromptLine={onMergePromptLine}
          loading={loading}
          askDisabled={askDisabled}
          onAsk={onAsk}
          hideBuyerStarterPromptGroups={showPostAssistantFollowUps}
        />

        {!buyerPolishedShell ? messageThreadPanel : null}
      </CardContent>
    </Card>
  );
}
