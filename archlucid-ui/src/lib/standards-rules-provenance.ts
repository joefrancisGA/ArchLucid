import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

import { governancePolicyPackDetailPath } from "@/lib/governance/governance-route-paths";
import { policyPackBuyerGovernanceDetailHref } from "@/lib/policy/policy-pack-buyer-label";
import { inferPolicyPackDisplayNameFromComplianceRuleKey } from "@/lib/policy/policy-pack-rule-key-prefix-catalog";
import {
  findFocusedPilotShowcaseRuleSeed,
  focusedPilotShowcasePolicyPackHref,
  FOCUSED_PILOT_SHOWCASE_RULE_SEEDS,
} from "@/lib/standards-rules-focused-pilot-showcase";
import {
  resolveBundledPolicyPackProvenanceLabel,
  STANDARDS_RULES_PLATFORM_DEFAULT_PROVENANCE_LABEL,
} from "@/lib/standards-rules-policy-pack-provenance";

const PLATFORM_DEFAULT_PROVENANCE_LABEL = STANDARDS_RULES_PLATFORM_DEFAULT_PROVENANCE_LABEL;

function resolvePolicyPackDetailHref(policyPackId: string): string | null {
  const trimmedId = policyPackId.trim();

  if (trimmedId.length === 0) {
    return null;
  }

  return policyPackBuyerGovernanceDetailHref(trimmedId) ?? governancePolicyPackDetailPath(trimmedId);
}

function findResolutionDecision(
  data: EffectiveGovernanceResolutionResult | null,
  ruleKey: string,
) {
  return data?.decisions.find((row) => row.itemKey === ruleKey);
}

export function resolveSourcePackLabel(
  data: EffectiveGovernanceResolutionResult | null,
  ruleKey: string,
): string {
  const decision = findResolutionDecision(data, ruleKey);

  if (decision !== undefined && decision.winningPolicyPackName.trim().length > 0) {
    return decision.winningPolicyPackName;
  }

  const showcaseSeed = findFocusedPilotShowcaseRuleSeed(ruleKey);

  if (showcaseSeed !== undefined) {
    return showcaseSeed.sourcePolicyPack;
  }

  return inferPolicyPackDisplayNameFromComplianceRuleKey(ruleKey) ?? "Workspace policy";
}

export function resolveSourcePackHref(
  data: EffectiveGovernanceResolutionResult | null,
  ruleKey: string,
): string | null {
  const decision = findResolutionDecision(data, ruleKey);
  const packId = decision?.winningPolicyPackId.trim() ?? "";

  if (packId.length > 0) {
    return resolvePolicyPackDetailHref(packId);
  }

  const showcaseSeed = findFocusedPilotShowcaseRuleSeed(ruleKey);

  if (showcaseSeed !== undefined) {
    return focusedPilotShowcasePolicyPackHref(showcaseSeed.bundledPackSlug);
  }

  const inferredPackName = inferPolicyPackDisplayNameFromComplianceRuleKey(ruleKey);

  if (inferredPackName !== null) {
    const matchingSeed = FOCUSED_PILOT_SHOWCASE_RULE_SEEDS.find((seed) => seed.sourcePolicyPack === inferredPackName);

    if (matchingSeed !== undefined) {
      return focusedPilotShowcasePolicyPackHref(matchingSeed.bundledPackSlug);
    }
  }

  return null;
}

export function resolveStandardsRulesPolicyPackProvenanceLabel(input: {
  readonly ruleKey: string;
  readonly policyPackId?: string | null;
  readonly data?: EffectiveGovernanceResolutionResult | null;
}): string | null {
  const fromRuleKey = resolveSourcePackProvenanceLabel(input.data ?? null, input.ruleKey);

  if (fromRuleKey !== null) {
    return fromRuleKey;
  }

  const packId = input.policyPackId?.trim() ?? "";

  if (packId.length > 0) {
    return resolveBundledPolicyPackProvenanceLabel(packId);
  }

  return null;
}

export function resolveSourcePackProvenanceLabel(
  data: EffectiveGovernanceResolutionResult | null,
  ruleKey: string,
): string | null {
  const showcaseSeed = findFocusedPilotShowcaseRuleSeed(ruleKey);

  if (showcaseSeed !== undefined) {
    return PLATFORM_DEFAULT_PROVENANCE_LABEL;
  }

  const inferredPackName = inferPolicyPackDisplayNameFromComplianceRuleKey(ruleKey);

  if (inferredPackName !== null) {
    const matchingSeed = FOCUSED_PILOT_SHOWCASE_RULE_SEEDS.find((seed) => seed.sourcePolicyPack === inferredPackName);

    if (matchingSeed !== undefined) {
      return PLATFORM_DEFAULT_PROVENANCE_LABEL;
    }
  }

  const decision = findResolutionDecision(data, ruleKey);

  if (decision !== undefined) {
    const fromPackId = resolveBundledPolicyPackProvenanceLabel(decision.winningPolicyPackId);

    if (fromPackId !== null) {
      return fromPackId;
    }
  }

  return null;
}
