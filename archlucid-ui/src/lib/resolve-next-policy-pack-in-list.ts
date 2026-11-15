import { policyPackDetailHref } from "@/lib/policy/policy-packs-deep-link";
import { sortPolicyPacksByRecency } from "@/lib/policy/sort-policy-packs-by-recency";
import type { PolicyPack } from "@/types/policy-packs";

export type PolicyPackDetailNextPackTarget = {
  readonly policyPackId: string;
  readonly name: string;
  readonly href: string;
};

/** Next policy pack in workspace list order after the current pack id. */
export function resolveNextPolicyPackInList(
  packs: readonly PolicyPack[],
  currentPolicyPackId: string,
  reviewId?: string | null,
  hubPath?: string,
): PolicyPackDetailNextPackTarget | null {
  const normalizedCurrentId = currentPolicyPackId.trim();
  const sorted = sortPolicyPacksByRecency(packs);
  const currentIndex = sorted.findIndex((pack) => pack.policyPackId === normalizedCurrentId);

  if (currentIndex < 0) {
    return null;
  }

  const nextPack = sorted[currentIndex + 1];

  if (nextPack === undefined) {
    return null;
  }

  return {
    policyPackId: nextPack.policyPackId,
    name: nextPack.name,
    href: policyPackDetailHref(nextPack.policyPackId, reviewId, hubPath),
  };
}
