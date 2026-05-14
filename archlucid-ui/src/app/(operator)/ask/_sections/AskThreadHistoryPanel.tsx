import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ConversationThread } from "@/types/conversation";

export type AskThreadHistoryPanelProps = {
  buyerPolishedShell: boolean;
  threads: ConversationThread[];
  selectedThreadId: string;
  listDateFormatter: (isoUtc: string) => string;
  onNewConversation: () => void;
  onSelectThread: (threadId: string) => void;
};

export function AskThreadHistoryPanel(props: AskThreadHistoryPanelProps) {
  const {
    buyerPolishedShell,
    threads,
    selectedThreadId,
    listDateFormatter,
    onNewConversation,
    onSelectThread,
  } = props;

  return (
    <Card className="h-fit border-neutral-200 dark:border-neutral-700">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          {buyerPolishedShell ? "Evidence Q&A history" : "Your conversation history"}
        </CardTitle>
        <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">
          {buyerPolishedShell ? (
            <>
              Answers are limited to the selected architecture review package and cite package evidence when available —
              open a saved thread below, or start a fresh question after linking the review package.
            </>
          ) : (
            <>
              Your saved conversations for this account. Start <strong>New conversation</strong> and select a review, or open
              one below to continue with its saved context.
            </>
          )}
        </p>      </CardHeader>
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
