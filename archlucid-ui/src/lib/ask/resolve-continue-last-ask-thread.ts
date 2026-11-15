import { readAskContinueLastThreadId } from "@/lib/ask/ask-continue-last-thread-storage";
import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import type { ConversationThread } from "@/types/conversation";

/** Thread to pin as Continue last conversation on the ask page. */
export function resolveContinueLastAskThread(threads: unknown): ConversationThread | null {
  const normalizedThreads = asNonemptyReadonlyArray<ConversationThread>(threads);

  if (normalizedThreads === null) {
    return null;
  }

  const validThreads = normalizedThreads.filter(
    (thread) => typeof thread?.threadId === "string" && typeof thread?.lastUpdatedUtc === "string",
  );

  if (validThreads.length === 0) {
    return null;
  }

  const recentThreadId = readAskContinueLastThreadId();

  if (recentThreadId !== null) {
    const recentMatch = validThreads.find((thread) => thread.threadId === recentThreadId);

    if (recentMatch !== undefined) {
      return recentMatch;
    }
  }

  let newestThread: ConversationThread | null = null;
  let newestTimestamp = Number.NEGATIVE_INFINITY;
  for (const thread of validThreads) {
    const timestamp = parseIsoUtcMs(thread.lastUpdatedUtc);
    if (timestamp > newestTimestamp) {
      newestThread = thread;
      newestTimestamp = timestamp;
    }
  }

  return newestThread;
}
