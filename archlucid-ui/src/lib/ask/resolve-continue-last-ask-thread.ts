import { readAskContinueLastThreadId } from "@/lib/ask/ask-continue-last-thread-storage";
import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";
import type { ConversationThread } from "@/types/conversation";

/** Thread to pin as Continue last conversation on the ask page. */
export function resolveContinueLastAskThread(threads: unknown): ConversationThread | null {
  const normalizedThreads = asNonemptyReadonlyArray<ConversationThread>(threads);

  if (normalizedThreads === null) {
    return null;
  }

  const recentThreadId = readAskContinueLastThreadId();

  if (recentThreadId !== null) {
    const recentMatch = normalizedThreads.find((thread) => thread.threadId === recentThreadId);

    if (recentMatch !== undefined) {
      return recentMatch;
    }
  }

  return (
    normalizedThreads
      .slice()
      .sort((left, right) => right.lastUpdatedUtc.localeCompare(left.lastUpdatedUtc))[0] ?? null
  );
}
