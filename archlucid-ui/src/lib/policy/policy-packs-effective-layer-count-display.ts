import type { EffectivePolicyPackSet } from "@/types/policy-packs";

export function formatPolicyPacksEffectiveLayerCount(effective: EffectivePolicyPackSet | null): string {
  if (effective === null) {
    return "Not loaded";
  }

  return String(effective.packs.length);
}
