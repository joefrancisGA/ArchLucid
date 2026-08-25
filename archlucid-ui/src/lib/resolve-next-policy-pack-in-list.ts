import { policyPacksEditHref } from "@/lib/policy/policy-packs-deep-link";
import type { PolicyPack } from "@/types/policy-packs";

export type PolicyPackDetailNextPackTarget = {
  readonly policyPackId: string;
  readonly name: string;
  readonly href: string;
};

function policyPackRecencyUtc(pack: PolicyPack): string {
  return pack.activatedUtc ?? pack.createdUtc;
}

/** Next policy pack in workspace list order after the current pack id. */
export function resolveNextPolicyPackInList(
  packs: readonly PolicyPack[],
  currentPolicyPackId: string,
): PolicyPackDetailNextPackTarget | null {
  const normalizedCurrentId = currentPolicyPackId.trim();
  const sorted = [...packs].sort((left, right) =>
    policyPackRecencyUtc(right).localeCompare(policyPackRecencyUtc(left)),
  );
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
    href: policyPacksEditHref(nextPack.policyPackId),
  };
}
