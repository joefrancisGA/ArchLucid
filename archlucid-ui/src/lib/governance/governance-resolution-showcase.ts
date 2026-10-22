import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

/** True when live resolution payload carries no compliance rule keys (showcase rows may fill the table). */
export function governanceResolutionUsesShowcaseRuleRows(
  data: EffectiveGovernanceResolutionResult | null,
): boolean {
  const keys =
    data?.effectiveContent?.complianceRuleKeys?.filter((key) => (key ?? "").trim().length > 0) ?? [];

  return keys.length === 0;
}
