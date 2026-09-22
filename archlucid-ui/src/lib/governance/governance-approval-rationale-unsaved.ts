/** Typed livelihood text in the governance approval review panel (LW-072). */
export function governanceApprovalRationaleHasUnsavedEdits(reviewComment: string): boolean {
  return reviewComment.trim().length > 0;
}
