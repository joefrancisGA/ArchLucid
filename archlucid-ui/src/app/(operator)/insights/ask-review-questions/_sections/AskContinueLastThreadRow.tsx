"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { ConversationThread } from "@/types/conversation";

export type AskContinueLastThreadRowProps = {
  readonly thread: ConversationThread;
  readonly onResume: (threadId: string) => void;
};

/** Pinned continue row for the most recently viewed ask conversation thread. */
export function AskContinueLastThreadRow(props: AskContinueLastThreadRowProps): React.JSX.Element {
  const title = props.thread.title.trim().length > 0 ? props.thread.title : "Untitled conversation";

  return (
    <section
      aria-labelledby="ask-continue-last-thread-heading"
      className="mb-4 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/20"
      data-testid="ask-continue-last-thread-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="ask-continue-last-thread-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last conversation
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{title}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="ask-continue-last-thread-open"
          onClick={() => {
            props.onResume(props.thread.threadId);
          }}
        >
          Resume thread
        </Button>
      </div>
    </section>
  );
}
