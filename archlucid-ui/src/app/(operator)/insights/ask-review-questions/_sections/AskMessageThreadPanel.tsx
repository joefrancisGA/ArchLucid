"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  buildAskAnswerCitationSourceLinks,
  collectCitedReviewIdsFromAskAnswerRefs,
  type BuyerAskGroundingLink,
} from "@/lib/ask-buyer-grounding-links";
import type { AskCitationActionFollowUp } from "@/lib/ask-citation-action-follow-ups";
import { AskAssistantMessageBody } from "@/components/AskAssistantMessageBody";
import { AskCitedFindingsSemanticSupportBandFootnote } from "@/components/ask/AskCitedFindingsSemanticSupportBandFootnote";
import { AskCitationActionFollowUps } from "@/components/ask/AskCitationActionFollowUps";
import { useAskCitedFindingsBandsQuery } from "@/hooks/use-ask-cited-findings-bands-query";
import {
  parseAskCitationRefsFromMessageMetadata,
  resolveAskCitationRefsEmptyState,
} from "@/lib/ask-citation-action-follow-ups";
import { AiOutputGovernanceLabel } from "@/components/AiOutputGovernanceLabel";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { ASK_CONVERSATION_EMPTY } from "@/lib/ask-conversation-empty-preset";
import {
  ASK_REVIEW_STREAMING_PROVISIONAL_MARKER,
  askReviewArtifactStatusCopy,
  ASK_CITATION_REFS_NOT_STORED_MARKER,
  resolveAskAssistantGroundingCitationMarker,
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
import {
  resolveAskAssistantAnswerFollowUpPrompts,
} from "@/lib/ask-assistant-answer-follow-ups";
import type { AskAnswerCitationRefs } from "@/lib/ask-buyer-grounding-links";
import {
  askCannedPromptFollowUpsDisclosureHrefFromSearch,
  parseAskCannedPromptFollowUpsOpenFromSearch,
} from "@/lib/insights/ask-canned-prompt-follow-ups-disclosure-url";
import type { ConversationMessage } from "@/types/conversation";

function askMessageHasStoredCitationRefs(refs: AskAnswerCitationRefs | null): boolean | null {
  if (refs === null) {
    return null;
  }

  const hasFinding = refs.referencedFindings.some((findingId) => findingId.trim().length > 0);
  const hasDecision = refs.referencedDecisions.some((decisionId) => decisionId.trim().length > 0);
  const hasArtifact = refs.referencedArtifacts.some((artifactId) => artifactId.trim().length > 0);

  return hasFinding || hasDecision || hasArtifact;
}

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
  isFinalizedReview?: boolean | undefined;
};

function formatAskUserTurnContent(content: string): string {
  if (content.length === 0) {
    return "Question was not stored.";
  }

  if (content.trim().length === 0) {
    return "Question was stored empty.";
  }

  return content;
}

function askMessageRoleLabel(role: string, buyerPolishedShell: boolean): string {
  if (role.trim().length === 0) {
    return "Speaker was not stored.";
  }

  const normalized = role.trim().toLowerCase();

  if (normalized === "user") {
    return buyerPolishedShell ? "You" : "Your question";
  }

  if (normalized === "assistant") {
    return "Assistant answer";
  }

  return role;
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
  const router = useRouter();
  const pathname = usePathname() ?? "/insights/ask-review-questions";
  const searchParams = useSearchParams();
  const askCannedPromptFollowUpsOpenParam = searchParams.get("askCannedPromptFollowUpsOpen");
  const [followUpsOpen, setFollowUpsOpenState] = useState(() =>
    parseAskCannedPromptFollowUpsOpenFromSearch(askCannedPromptFollowUpsOpenParam),
  );
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
    isFinalizedReview = false,
  } = props;

  const artifactStatus = resolveAskReviewArtifactStatus({
    runMissing: false,
    isFinalized: isFinalizedReview,
  });
  const artifactStatusCopy = askReviewArtifactStatusCopy(artifactStatus);
  const citationHostMessageId = lastAssistantMessageId(messages);
  const citationHostMessage =
    citationHostMessageId === null
      ? null
      : messages.find((message) => message.messageId === citationHostMessageId) ?? null;
  const citationHostCitationRefs =
    citationHostMessage === null
      ? null
      : parseAskCitationRefsFromMessageMetadata(citationHostMessage.metadataJson);
  const citationHostEmptyState =
    citationHostMessage === null
      ? { citationRefsOmitted: true, citationRefsStoredEmpty: false }
      : resolveAskCitationRefsEmptyState(citationHostMessage.metadataJson);
  const assistantAnswerFollowUpPrompts = resolveAskAssistantAnswerFollowUpPrompts(
    citationHostMessage?.content ?? "",
    { hasCitations: askMessageHasStoredCitationRefs(citationHostCitationRefs) },
  );
  const showCitationActionsOnAnswer =
    streamingAssistantContent === null && citationHostMessageId !== null;
  const citedFindingsBandsQuery = useAskCitedFindingsBandsQuery(runId, {
    enabled: runId.trim().length > 0,
  });
  const citedFindingBandIndex = citedFindingsBandsQuery.data ?? [];
  const streamingCitedReviewIds = useMemo((): ReadonlySet<string> => {
    const scoped = runId.trim();

    if (scoped.length === 0) {
      return new Set<string>();
    }

    return new Set([canonicalizeDemoRunId(scoped).toLowerCase()]);
  }, [runId]);

  const syncFollowUpsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(askCannedPromptFollowUpsDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setFollowUpsOpen = useCallback(
    (open: boolean) => {
      setFollowUpsOpenState(open);
      syncFollowUpsOpenToUrl(open);
    },
    [syncFollowUpsOpenToUrl],
  );

  useEffect(() => {
    setFollowUpsOpenState(parseAskCannedPromptFollowUpsOpenFromSearch(askCannedPromptFollowUpsOpenParam));
  }, [askCannedPromptFollowUpsOpenParam]);

  return (
    <div className="space-y-3 pt-1">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {buyerPolishedShell ? "Evidence Q&A exchange" : "Conversation"}
        </h3>
        <StatusTag kind="neutral" label={artifactStatusCopy} data-testid="ask-review-artifact-status" />
        <span
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="ask-review-id"
        >
          {runId.trim().length > 0 ? `Review id: ${runId.trim()}` : "Review id was not stored."}
        </span>
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
                        className="h-auto max-w-full whitespace-normal border-neutral-200/80 py-1 text-left dark:border-neutral-700"
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
        {messages.map((message) => {
          const assistantCitationRefs =
            message.role.toLowerCase() === "assistant"
              ? parseAskCitationRefsFromMessageMetadata(message.metadataJson)
              : null;
          const assistantCitationSourceLinks =
            buyerPolishedShell && assistantCitationRefs !== null
              ? buildAskAnswerCitationSourceLinks(runId, assistantCitationRefs)
              : (askAssistantGroundingLinks ?? []);
          const citedReviewIds = collectCitedReviewIdsFromAskAnswerRefs(runId, assistantCitationRefs);

          return (
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
                  {(() => {
                    const groundingMarker = resolveAskAssistantGroundingCitationMarker(
                      message.content,
                      assistantCitationRefs,
                    );

                    return groundingMarker !== null ? (
                      <p
                        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                        data-testid="ask-uncited-assistant-marker"
                        role="note"
                      >
                        {groundingMarker}
                      </p>
                    ) : null;
                  })()}
                  {message.metadataJson?.trim() &&
                  message.metadataJson.trim() !== "{}" &&
                  assistantCitationRefs === null &&
                  message.content.trim().length > 0 ? (
                    <p
                      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid="ask-citation-refs-not-stored-marker"
                      role="note"
                    >
                      {ASK_CITATION_REFS_NOT_STORED_MARKER}
                    </p>
                  ) : null}
                  <AskAssistantMessageBody
                    buyerPolishedLinks={buyerPolishedShell}
                    content={message.content}
                    groundingLinks={
                      assistantCitationSourceLinks.length > 0 ? assistantCitationSourceLinks : undefined
                    }
                    citedReviewIds={citedReviewIds}
                  />
                  <AskCitedFindingsSemanticSupportBandFootnote
                    referencedFindingIds={assistantCitationRefs?.referencedFindings ?? []}
                    findingBandIndex={citedFindingBandIndex}
                  />
                  {showCitationActionsOnAnswer && message.messageId === citationHostMessageId ? (
                    <AskCitationActionFollowUps
                      chips={askCitationActionFollowUps}
                      showHonestEmpty={showPostAssistantFollowUps}
                      citationRefsOmitted={citationHostEmptyState.citationRefsOmitted}
                      citationRefsStoredEmpty={citationHostEmptyState.citationRefsStoredEmpty}
                      reviewId={runId}
                    />
                  ) : null}
                </>
              ) : (
                <p className={cn("m-0 whitespace-pre-wrap text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {formatAskUserTurnContent(message.content)}
                </p>
              )}
            </CardContent>
          </Card>
          );
        })}
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
                content={
                  streamingAssistantContent.length > 0
                    ? streamingAssistantContent
                    : "Answer text was not received yet."
                }
                citedReviewIds={streamingCitedReviewIds}
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
              {assistantAnswerFollowUpPrompts.map((line) => (
                <Button
                  key={line}
                  type="button"
                  variant="outline"
                  size="sm"
                        className="h-auto max-w-full whitespace-normal border-neutral-200/80 py-1 text-left dark:border-neutral-700"
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
        <details
          className="space-y-2 pt-1"
          data-testid="ask-canned-prompt-follow-ups"
          open={followUpsOpen}
          onToggle={(event) => {
            setFollowUpsOpen(event.currentTarget.open);
          }}
        >
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
                    className="h-auto max-w-full whitespace-normal py-1.5 text-left text-al-text-secondary"
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
