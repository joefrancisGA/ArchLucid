/** Canonical skipped-MUST seal blocked reason (server source of truth mirror — WA-12). */
export function formatAuthorityCommitSkippedMustBlockedReason(skippedMustCount: number): string {
  if (skippedMustCount <= 0) {
    throw new RangeError("skippedMustCount must be positive");
  }

  const noun = skippedMustCount === 1 ? "question is" : "questions are";

  return `${skippedMustCount} required ${noun} unanswered.`;
}
