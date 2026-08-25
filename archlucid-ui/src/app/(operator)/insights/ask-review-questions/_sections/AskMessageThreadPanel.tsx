import { cn } from "@/lib/utils";
import type { BuyerAskGroundingLink } from "@/lib/ask-buyer-grounding-links";
import type { AskCitationActionFollowUp } from "@/lib/ask-citation-action-follow-ups";
import { AskAssistantMessageBody } from "@/components/AskAssistantMessageBody";
import { AskCitationActionFollowUps } from "@/components/ask/AskCitationActionFollowUps";
import { AiOutputGovernanceLabel } from "@/components/AiOutputGovernanceLabel";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { ASK_CONVERSATION_EMPTY } from "@/lib/ask-conversation-empty-preset";
import {
  ASK_REVIEW_STREAMING_PROVISIONAL_MARKER,
  ASK_REVIEW_UNCITED_RESPONSE_MARKER,
  askReviewArtifactStatusCopy,
  messageHasUncitedAssistantOutput,
  resolveAskReviewArtifactStatus,
} from "@/lib/ask-review-artifact-status-copy";
import {
  BUYER_ASK_CONVERSATION_EMPTY_BODY,
  BUYER_ASK_CONVERSATION_EMPTY_TITLE,
  BUYER_ASK_RETRIEVAL_DEGRADED_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ASK_BUYER_PROMPT_GROUPS,
  ASK_EMPTY_THREAD_REVIEW_STARTER_PROMPTS,
} from "@/app/(operator)/insights/ask-review-questions/_sections/ask-page-constants";
import { ASK_ASSISTANT_ANSWER_FOLLOW_UP_PROMPTS } from "@/lib/ask-assistant-answer-follow-ups";
import type { ConversationMessage } from "@/types/conversation";

export type AskMessageThreadPanelProps = {
  buyerPolishedShell: boolean;
  messages: ConversationMessage[];
  streamingAssistantContent: string | null;
  askAssistantGroundingLinks: readonly BuyerAskGroundingLink[] | null;
  askCitationActionFollowUps: readonly AskCitationActionFollowUp[];
  showPostAssistantFollowUps: boolean;
  runAnchorUnset: boolean;
  onMergePromptLine: (line: string) => void;
  onStarterPromptClick?: (line: string) => void;
  runId: string;
  retrievalDegraded?: boolean;
  isFinalizedReview?: boolean;
};

function askMessageRoleLabel(role: string, buyerPolishedShell: boolean): string {
  if (!buyerPolishedShell) {
    return role;
  }

  if (role.toLowerCase() === "user") {
    return "You";
  }

  return "Assistant";
}

function lastAssistantMessageId(messages: ConversationMessage[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message !== undefined && message.role.toLowerCase() === "assistant") {
      return message.messageId;
    }
  }

  return null;
}

export function AskMessageThreadPanel(props: AskMessageThreadPanelProps) {
  const {
    buyerPolishedShell,
    messages,
    streamingAssistantContent,
    askAssistantGroundingLinks,
    askCitationActionFollowUps,
    showPostAssistantFollowUps,
    onMergePromptLine,
    onStarterPromptClick,
    runId,
    retrievalDegraded = false,
    isFinalizedReview = true,
  } = props;

  const artifactStatus = resolveAskReviewArtifactStatus({
    runMissing: false,
    isFinalized: isFinalizedReview,
  });
  const artifactStatusCopy = askReviewArtifactStatusCopy(artifactStatus);
  const groundingLinkCount = askAssistantGroundingLinks?.length ?? 0;
  const citationHostMessageId = lastAssistantMessageId(messages);
  const showCitationActionsOnAnswer =
    streamingAssistantContent === null && citationHostMessageId !== null;

  return (
    <div className="space-y-3 pt-1">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {buyerPolishedShell ? "Evidence Q&A exchange" : "Conversation"}
        </h3>
        <StatusTag kind="neutral" label={artifactStatusCopy} data-testid="ask-review-artifact-status" />
        {retrievalDegraded ? (
          <StatusTag
            kind="needs-attention"
            label={
              buyerPolishedShell
                ? BUYER_ASK_RETRIEVAL_DEGRADED_LABEL
                : "Vector search unavailable; using text search instead."
            }
            data-testid="ask-retrieval-degraded-badge"
          />
        ) : null}
      </div>
      <div className="grid gap-3">
        {messages.length === 0 ? (
          <div className="space-y-3" data-testid="ask-conversation-empty-region">
            <EnterpriseCompactEmptyState
              {...ASK_CONVERSATION_EMPTY}
              title={buyerPolishedShell ? BUYER_ASK_CONVERSATION_EMPTY_TITLE : ASK_CONVERSATION_EMPTY.title}
              description={
                buyerPolishedShell ? BUYER_ASK_CONVERSATION_EMPTY_BODY : ASK_CONVERSATION_EMPTY.description
              }
            />
            {runId.trim().length > 0 ? (
              <div className="space-y-2" data-testid="ask-empty-thread-starters">
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {buyerPolishedShell ? "Try a starter question" : "Starter questions for this review"}
                </p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Starter questions">
                  {ASK_EMPTY_THREAD_REVIEW_STARTER_PROMPTS.map((line) => (
                    <Button
                      key={line}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-auto max-w-full whitespace-normal border-neutral-200/80 py-1 text-left font-normal dark:border-neutral-700",
                        OPERATOR_TYPOGRAPHY.helper,
                      )}
                      onClick={() => {
                        if (onStarterPromptClick !== undefined) {
                          onStarterPromptClick(line);
                        } else {
                          onMergePromptLine(line);
                        }
                      }}
                    >
                      {line}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {messages.map((message) => (
          <Card
            key={message.messageId}
            className={cn(
              "border",
              message.role === "User"
                ? "border-neutral-200/90 bg-al-surface-raised dark:border-neutral-800/80"
                : "border-neutral-200 bg-neutral-50/90 dark:border-neutral-700 dark:bg-neutral-800/50",
            )}
          >
            <CardContent className="space-y-1 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  {askMessageRoleLabel(message.role, buyerPolishedShell)}
                </div>
                {message.role.toLowerCase() === "assistant" ? <AiOutputGovernanceLabel forceAdvisory /> : null}
              </div>
              {message.role.toLowerCase() === "assistant" ? (
                <>
                  {messageHasUncitedAssistantOutput(message.content, groundingLinkCount) ? (
                    <p
                      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid="ask-uncited-assistant-marker"
                      role="note"
                    >
                      {ASK_REVIEW_UNCITED_RESPONSE_MARKER}
                    </p>
                  ) : null}
                  <AskAssistantMessageBody
                    buyerPolishedLinks={buyerPolishedShell}
                    content={message.content}
                    groundingLinks={askAssistantGroundingLinks ?? undefined}
                  />
                  {showCitationActionsOnAnswer && message.messageId === citationHostMessageId ? (
                    <AskCitationActionFollowUps
                      chips={askCitationActionFollowUps}
                      showHonestEmpty={showPostAssistantFollowUps && buyerPolishedShell}
                    />
                  ) : null}
                </>
              ) : (
                <p className={cn("m-0 whitespace-pre-wrap text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {message.content}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {streamingAssistantContent !== null ? (
          <Card
            className="border border-neutral-200 bg-neutral-50/90 dark:border-neutral-700 dark:bg-neutral-800/50"
            data-testid="ask-streaming-assistant"
            aria-busy="true"
          >
            <CardContent className="space-y-1 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  {askMessageRoleLabel("assistant", buyerPolishedShell)}
                </div>
                <AiOutputGovernanceLabel forceAdvisory />
              </div>
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="ask-streaming-provisional-marker"
                role="note"
              >
                {ASK_REVIEW_STREAMING_PROVISIONAL_MARKER}
              </p>
              <AskAssistantMessageBody
                buyerPolishedLinks={buyerPolishedShell}
                content={streamingAssistantContent.length > 0 ? streamingAssistantContent : "…"}
              />
            </CardContent>
          </Card>
        ) : null}
        {citationHostMessageId !== null && streamingAssistantContent === null ? (
          <div className="space-y-2" data-testid="ask-assistant-answer-follow-ups">
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {buyerPolishedShell ? "Suggested follow-ups" : "Follow up on this answer"}
            </p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggested follow-up questions">
              {ASK_ASSISTANT_ANSWER_FOLLOW_UP_PROMPTS.map((line) => (
                <Button
                  key={line}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-auto max-w-full whitespace-normal border-neutral-200/80 py-1 text-left font-normal dark:border-neutral-700",
                    OPERATOR_TYPOGRAPHY.helper,
                  )}
                  onClick={() => {
                    if (onStarterPromptClick !== undefined) {
                      onStarterPromptClick(line);
                    } else {
                      onMergePromptLine(line);
                    }
                  }}
                >
                  {line}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {showPostAssistantFollowUps ? (
        <details className="space-y-2 pt-1" data-testid="ask-canned-prompt-follow-ups">
          <summary
            className={cn(
              "cursor-pointer select-none text-al-text-secondary",
              OPERATOR_TYPOGRAPHY.helper,
            )}
          >
            More suggested questions
          </summary>
          <div className="space-y-3 pt-2 opacity-90" role="region" aria-label="Suggested follow-ups by topic">
            {ASK_BUYER_PROMPT_GROUPS.map((group) => (
              <div key={group.heading} className="space-y-2">
                <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>{group.heading}</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label={group.heading}>
                  {group.prompts.map((line) => (
                    <Button
                      key={`follow-${group.heading}-${line}`}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-auto max-w-full whitespace-normal py-1.5 text-left font-normal text-al-text-secondary",
                        OPERATOR_TYPOGRAPHY.helper,
                      )}
                      disabled={false}
                      onClick={() => onMergePromptLine(line)}
                    >
                      {line}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
