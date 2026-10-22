import type { OperatorAttentionKindId } from "@/lib/operator/operator-attention-taxonomy";

export type ResolveReviewsHubAttentionSuppressKindsInput = {
  readonly hasContinueStrip: boolean;
  readonly hasInProgressInventory: boolean;
  readonly readyForGovernanceCount: number;
};

/** Suppress attention chips the reviews hub already surfaces as a primary zone. */
export function resolveReviewsHubAttentionSuppressKinds(
  input: ResolveReviewsHubAttentionSuppressKindsInput,
): readonly OperatorAttentionKindId[] {
  const suppressed: OperatorAttentionKindId[] = [];

  if (input.hasContinueStrip || input.hasInProgressInventory) {
    suppressed.push("unfinished-work");
  }

  if (input.readyForGovernanceCount > 0) {
    suppressed.push("awaiting-approval");
  }

  return suppressed;
}
