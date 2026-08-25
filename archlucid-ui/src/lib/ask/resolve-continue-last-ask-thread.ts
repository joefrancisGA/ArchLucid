import { readAskContinueLastThreadId } from "@/lib/ask/ask-continue-last-thread-storage";
import type { ConversationThread } from "@/types/conversation";

/** Thread to pin as Continue last conversation on the ask page. */
export function resolveContinueLastAskThread(
  threads: readonly ConversationThread[],
): ConversationThread | null {
  if (threads.length === 0) {
    return null;
  }

  const recentThreadId = readAskContinueLastThreadId();

  if (recentThreadId !== null) {
    const recentMatch = threads.find((thread) => thread.threadId === recentThreadId);

    if (recentMatch !== undefined) {
      return recentMatch;
    }
  }

  return (
    threads
      .slice()
      .sort((left, right) => right.lastUpdatedUtc.localeCompare(left.lastUpdatedUtc))[0] ?? null
  );
}
