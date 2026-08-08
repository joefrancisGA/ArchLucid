export type RunSummaryStreamPhase = "streaming" | "poll-fallback" | "complete";

export const RUN_SUMMARY_FALLBACK_POLL_MS = 3000;

/**
 * Poll matrix (TB-2029):
 * - SSE connected → no HTTP fallback poll
 * - SSE error / unavailable → HTTP poll every 3s while tab visible
 * - Hidden tab → pause HTTP fallback poll; resume on visibility
 */
export function shouldRunRunSummaryFallbackPoll(args: {
  readonly sseConnected: boolean;
  readonly documentHidden: boolean;
  readonly streamPhase: RunSummaryStreamPhase;
}): boolean {
  if (args.sseConnected || args.documentHidden || args.streamPhase === "complete") {
    return false;
  }

  return args.streamPhase === "poll-fallback";
}
