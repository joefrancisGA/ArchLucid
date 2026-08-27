import { cn } from "@/lib/utils";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { ASK_THREAD_HISTORY_EMPTY } from "@/lib/ask-conversation-empty-preset";
import type { ConversationThread } from "@/types/conversation";

const ASK_THREAD_HISTORY_NAV_LABEL_OPERATOR = "Conversation history";
const ASK_THREAD_HISTORY_NAV_LABEL_BUYER = "Saved review questions";

export type AskThreadHistoryPanelProps = {
  buyerPolishedShell: boolean;
  /** Selected review for buyer-scoped context labels. */
  runId: string;
  threads: ConversationThread[];
  selectedThreadId: string;
  listDateFormatter: (isoUtc: string) => string;
  onNewConversation: () => void;
  onSelectThread: (threadId: string) => void;
};

export function AskThreadHistoryPanel(props: AskThreadHistoryPanelProps) {
  const {
    buyerPolishedShell,
    runId,
    threads,
    selectedThreadId,
    listDateFormatter,
    onNewConversation,
    onSelectThread,
  } = props;

  const scopedPackageLabel =
    canonicalizeDemoRunId(runId.trim()) === SHOWCASE_STATIC_DEMO_RUN_ID
      ? `Scoped to ${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE}`
      : "Scoped to the selected review";
  const threadListNavLabel = buyerPolishedShell
    ? ASK_THREAD_HISTORY_NAV_LABEL_BUYER
    : ASK_THREAD_HISTORY_NAV_LABEL_OPERATOR;

  return (
    <Card className="h-fit border-neutral-200 dark:border-neutral-700">
      <CardHeader className="p-4 pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>
          {buyerPolishedShell ? "Saved review questions" : "Your conversation history"}
        </CardTitle>
        {buyerPolishedShell ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{scopedPackageLabel}</p>
        ) : null}
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {buyerPolishedShell ? (
            <>Pick a thread below to resume, or start a new question once a review is selected.</>
          ) : (
            <>
              Your saved conversations for this account. Start <strong>New conversation</strong> and select a review, or open
              one below to continue with its saved context.
            </>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <Button
          type="button"
          variant={buyerPolishedShell ? "outline" : "outline"}
          className={
            buyerPolishedShell
              ? cn(
                  "h-auto w-full justify-center py-1.5 underline-offset-2 hover:bg-transparent hover:underline",
                  OPERATOR_LINK.nav,
                )
              : "w-full border-neutral-300 text-al-text-primary hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
          }
          onClick={onNewConversation}
        >
          {buyerPolishedShell ? "Ask a new review question" : "New conversation"}
        </Button>
        {threads.length === 0 ? <EnterpriseCompactEmptyState {...ASK_THREAD_HISTORY_EMPTY} /> : null}
        {threads.length > 0 ? (
          <nav aria-label={threadListNavLabel}>
            <ul className="m-0 list-none space-y-1 p-0">
              {threads
                .filter((thread): thread is ConversationThread => thread != null && typeof thread.threadId === "string")
                .map((thread) => (
                <li key={thread.threadId}>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-auto w-full justify-start whitespace-normal py-2 text-left",
                      selectedThreadId === thread.threadId &&
                        "border border-neutral-300 bg-[var(--al-layer-hover)] dark:border-neutral-600 dark:bg-neutral-800/80",
                    )}
                    aria-current={selectedThreadId === thread.threadId ? "true" : undefined}
                    onClick={() => void onSelectThread(thread.threadId)}
                  >
                    <span>
                      {thread.title}
                      <div className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                        {listDateFormatter(thread.lastUpdatedUtc)}
                      </div>
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </CardContent>
    </Card>
  );
}
