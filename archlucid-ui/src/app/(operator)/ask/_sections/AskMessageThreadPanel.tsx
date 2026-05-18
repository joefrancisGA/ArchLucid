import type { BuyerAskGroundingLink } from "@/lib/ask-buyer-grounding-links";
import { AskAssistantMessageBody } from "@/components/AskAssistantMessageBody";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ASK_CONVERSATION_EMPTY } from "@/lib/ask-conversation-empty-preset";
import { tryStaticDemoConversationMessages } from "@/lib/ask-static-demo-messages";
import { cn } from "@/lib/utils";
import { ASK_BUYER_PROMPT_GROUPS } from "@/app/(operator)/ask/_sections/ask-page-constants";
import type { ConversationMessage } from "@/types/conversation";

export type AskMessageThreadPanelProps = {
  buyerPolishedShell: boolean;
  selectedThreadId: string;
  messages: ConversationMessage[];
  askAssistantGroundingLinks: readonly BuyerAskGroundingLink[] | null;
  showPostAssistantFollowUps: boolean;
  runMissing: boolean;
  onMergePromptLine: (line: string) => void;
};

export function AskMessageThreadPanel(props: AskMessageThreadPanelProps) {
  const {
    buyerPolishedShell,
    selectedThreadId,
    messages,
    askAssistantGroundingLinks,
    showPostAssistantFollowUps,
    runMissing,
    onMergePromptLine,
  } = props;

  return (
    <div className="space-y-3 pt-1">
      {buyerPolishedShell ? (
        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
          Each assistant reply is scoped to the selected package; verify citations on the linked surfaces before you rely on
          them in diligence.
        </p>
      ) : null}
      {buyerPolishedShell && tryStaticDemoConversationMessages(selectedThreadId.trim()) !== null ? (
        <p className="m-0 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Example review question — illustrative Q&A for the Claims Intake sample walkthrough.
        </p>
      ) : null}
      <h3 className="mb-3 m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {buyerPolishedShell ? "Evidence Q&A exchange" : "Conversation"}
      </h3>
      <div className="grid gap-3">
        {messages.length === 0 ? <EmptyState {...ASK_CONVERSATION_EMPTY} /> : null}
        {messages.map((message) => (
          <Card
            key={message.messageId}
            className={cn(
              "border",
              message.role === "User"
                ? "border-sky-200/90 bg-sky-50/90 dark:border-sky-800/80 dark:bg-sky-950/35"
                : "border-neutral-200 bg-neutral-50/90 dark:border-neutral-700 dark:bg-neutral-800/50",
            )}
          >
            <CardContent className="space-y-1 p-3">
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{message.role}</div>
              {message.role.toLowerCase() === "assistant" ? (
                <AskAssistantMessageBody
                  buyerPolishedLinks={buyerPolishedShell}
                  content={message.content}
                  groundingLinks={askAssistantGroundingLinks ?? undefined}
                />
              ) : (
                <p className="m-0 whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-200">{message.content}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {showPostAssistantFollowUps ? (
        <div className="space-y-4 pt-1">
          <p className="m-0 text-xs font-medium text-neutral-600 dark:text-neutral-400">Suggested follow-ups</p>
          <div className="space-y-3" role="region" aria-label="Suggested follow-ups by topic">
            {ASK_BUYER_PROMPT_GROUPS.map((group) => (
              <div key={group.heading} className="space-y-2">
                <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {group.heading}
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label={group.heading}>
                  {group.prompts.map((line) => (
                    <Button
                      key={`follow-${group.heading}-${line}`}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-auto max-w-full whitespace-normal py-1.5 text-left text-xs font-normal"
                      disabled={runMissing}
                      onClick={() => onMergePromptLine(line)}
                    >
                      {line}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
