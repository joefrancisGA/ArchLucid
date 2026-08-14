import {
  policyPackTypeBuyerDisplayLabel,
  POLICY_PACK_TYPE_PLATFORM_DEFAULT,
} from "@/lib/policy/policy-pack-type-label";
import { FOCUSED_PILOT_SHOWCASE_RULE_SEEDS } from "@/lib/standards-rules-focused-pilot-showcase";

export const STANDARDS_RULES_PLATFORM_DEFAULT_PROVENANCE_LABEL = policyPackTypeBuyerDisplayLabel(
  POLICY_PACK_TYPE_PLATFORM_DEFAULT,
);

const FOCUSED_PILOT_BUNDLED_PACK_IDS = new Set(
  FOCUSED_PILOT_SHOWCASE_RULE_SEEDS.map((seed) => seed.bundledPackSlug.trim().toLowerCase()),
);

export function isFocusedPilotBundledPolicyPackId(policyPackId: string): boolean {
  const normalizedId = policyPackId.trim().toLowerCase();

  if (normalizedId.length === 0) {
    return false;
  }

  return FOCUSED_PILOT_BUNDLED_PACK_IDS.has(normalizedId);
}

export function resolveBundledPolicyPackProvenanceLabel(policyPackId: string): string | null {
  if (!isFocusedPilotBundledPolicyPackId(policyPackId)) {
    return null;
  }

  return STANDARDS_RULES_PLATFORM_DEFAULT_PROVENANCE_LABEL;
}
