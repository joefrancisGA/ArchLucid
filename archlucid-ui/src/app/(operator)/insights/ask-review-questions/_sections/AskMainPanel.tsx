import { cn } from "@/lib/utils";
import type { RefObject } from "react";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Card, CardContent } from "@/components/ui/card";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { BuyerAskGroundingLink } from "@/lib/ask-buyer-grounding-links";
import type { AskCitationActionFollowUp } from "@/lib/ask-citation-action-follow-ups";
import { BUYER_ASK_SYNTHETIC_SAMPLE_HINT } from "@/lib/buyer/buyer-polish-copy";
import type { ConversationMessage } from "@/types/conversation";
import { OPERATOR_NAV_GROUP_LABEL } from "@/lib/design-tokens";
import { AskCompareReviewsCollapsible } from "@/app/(operator)/insights/ask-review-questions/_sections/AskCompareReviewsCollapsible";
import { AskMessageThreadPanel } from "@/app/(operator)/insights/ask-review-questions/_sections/AskMessageThreadPanel";
import { AskQuestionForm } from "@/app/(operator)/insights/ask-review-questions/_sections/AskQuestionForm";
import { AskReviewScopeStrip } from "@/app/(operator)/insights/ask-review-questions/_sections/AskReviewScopeStrip";

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
  runAnchorUnset: boolean;
  onMergePromptLine: (line: string) => void;
  onStarterPromptClick?: (line: string) => void;
  loading: boolean;
  askDisabled: boolean;
  onAsk: (overrideQuestion?: string) => void;
  actionFailure: ApiLoadFailureState | null;
  messages: ConversationMessage[];
  streamingAssistantContent: string | null;
  askAssistantGroundingLinks: readonly BuyerAskGroundingLink[] | null;
  askCitationActionFollowUps: readonly AskCitationActionFollowUp[];
  showPostAssistantFollowUps: boolean;
  retrievalDegraded?: boolean;
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
    runAnchorUnset,
    onMergePromptLine,
    onStarterPromptClick,
    loading,
    askDisabled,
    onAsk,
    actionFailure,
    messages,
    streamingAssistantContent,
    askAssistantGroundingLinks,
    askCitationActionFollowUps,
    showPostAssistantFollowUps,
    retrievalDegraded = false,
  } = props;

  const messageThreadPanel = (
    <AskMessageThreadPanel
      buyerPolishedShell={buyerPolishedShell}
      messages={messages}
      streamingAssistantContent={streamingAssistantContent}
      askAssistantGroundingLinks={askAssistantGroundingLinks}
      askCitationActionFollowUps={askCitationActionFollowUps}
      showPostAssistantFollowUps={showPostAssistantFollowUps}
      runAnchorUnset={runAnchorUnset}
      onMergePromptLine={onMergePromptLine}
      onStarterPromptClick={onStarterPromptClick}
      runId={runId}
      retrievalDegraded={retrievalDegraded}
    />
  );

  return (
    <Card className="border-neutral-200 dark:border-neutral-700">
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-3">
          <div className="max-w-md">
            <AskRunIdPicker
              value={runId}
              onChange={onRunIdChange}
              selectedThreadId={selectedThreadId}
              fieldId="ask-run-primary"
              label="Review"
              syntheticSampleHint={BUYER_ASK_SYNTHETIC_SAMPLE_HINT}
              autoSelectSyntheticSample={!buyerPolishedShell}
            />
          </div>
          <AskReviewScopeStrip runId={runId} buyerPolishedShell={buyerPolishedShell} />
          {hideCompareChrome ? null : (
            <div className="space-y-2">
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>
                Advanced
              </p>
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
            </div>
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

        <AskQuestionForm
          questionRef={questionRef}
          question={question}
          onQuestionChange={onQuestionChange}
          buyerPolishedShell={buyerPolishedShell}
          showRunDeepLinkPrompts={showRunDeepLinkPrompts}
          runAnchorUnset={runAnchorUnset}
          onMergePromptLine={onMergePromptLine}
          loading={loading}
          askDisabled={askDisabled}
          onAsk={onAsk}
          showLongWait={loading && streamingAssistantContent === null}
          hideBuyerStarterPromptGroups={showPostAssistantFollowUps}
        />

        {messageThreadPanel}
      </CardContent>
    </Card>
  );
}
