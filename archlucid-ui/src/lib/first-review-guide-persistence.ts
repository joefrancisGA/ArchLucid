import type { CorePilotCommitContext } from "@/lib/core-pilot-commit-context";

export function hasSealedReviewRecord(commitContext: CorePilotCommitContext): boolean {
  return commitContext.firstCommittedRunId !== null;
}
