import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";
import type { ConversationThread } from "@/types/conversation";

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
      : "Scoped to the selected review package";

  return (
    <Card className="h-fit border-neutral-200 dark:border-neutral-700">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          {buyerPolishedShell ? "Questions for this review" : "Your conversation history"}
        </CardTitle>
        {buyerPolishedShell ? (
          <p className="m-0 text-xs font-medium text-neutral-600 dark:text-neutral-400">{scopedPackageLabel}</p>
        ) : null}
        <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">
          {buyerPolishedShell ? (
            <>
              Pick a thread below to resume, or start a new question once a review is selected.
            </>
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
          variant={buyerPolishedShell ? "ghost" : "outline"}
          className={
            buyerPolishedShell
              ? "h-auto w-full justify-center py-1.5 text-sm font-normal text-teal-800 underline-offset-2 hover:bg-transparent hover:text-teal-900 hover:underline dark:text-teal-300 dark:hover:text-teal-200"
              : "w-full border-neutral-300 text-neutral-800 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          }
          onClick={onNewConversation}
        >
          {buyerPolishedShell ? "Ask a new review question" : "New conversation"}
        </Button>
        <ul className="m-0 list-none space-y-1 p-0">
          {threads.map((thread) => (
            <li key={thread.threadId}>
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  "h-auto w-full justify-start whitespace-normal py-2 text-left text-sm",
                  selectedThreadId === thread.threadId &&
                    "border border-teal-300 bg-teal-50/80 font-semibold dark:border-teal-700 dark:bg-teal-950/40",
                  selectedThreadId !== thread.threadId && "font-normal",
                )}
                onClick={() => void onSelectThread(thread.threadId)}
              >
                <span>
                  {thread.title}
                  <div className="text-xs font-normal text-neutral-500 dark:text-neutral-500">
                    {listDateFormatter(thread.lastUpdatedUtc)}
                  </div>
                </span>
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
