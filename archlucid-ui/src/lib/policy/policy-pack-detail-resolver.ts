import type { PolicyPack } from "@/types/policy-packs";

import { resolveSampleScenarioByPolicyPackId } from "@/lib/samples/registry";
import { RESPONSIBLE_AI_POLICY_PACK_BREADCRUMB_LABEL } from "@/lib/responsible-ai-policy-pack-detail-content";
import { POLICY_PACK_TYPE_PLATFORM_DEFAULT } from "@/lib/policy/policy-pack-type-label";

export type PolicyPackDetailKind = "responsible-ai" | "healthcare-claims" | "unknown";

/** Canonical bundled Responsible AI template id (DEFAULT_POLICY_PACKS_V1.md). */
export const BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID = "ai-governance-responsible-ai-v1";

const RESPONSIBLE_AI_POLICY_PACK_ID_ALIASES = new Set([
  BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID,
  "ai-governance-responsible-ai",
  "responsible-ai",
  "responsible-ai-v1",
]);

function normalizePolicyPackToken(value: string): string {
  return value.trim().toLowerCase();
}

function isSamplePrivacyPolicyPackId(policyPackId: string): boolean {
  return resolveSampleScenarioByPolicyPackId(policyPackId) !== null;
}

export function isResponsibleAiPolicyPackId(policyPackId: string): boolean {
  return RESPONSIBLE_AI_POLICY_PACK_ID_ALIASES.has(normalizePolicyPackToken(policyPackId));
}

function isPlatformDefaultResponsibleAiPack(pack: PolicyPack): boolean {
  const packType = pack.packType?.trim() ?? "";

  if (packType !== POLICY_PACK_TYPE_PLATFORM_DEFAULT) {
    return false;
  }

  return isResponsibleAiPolicyPackId(pack.policyPackId);
}

export function resolvePolicyPackDetailKind(policyPackId: string, pack: PolicyPack | null): PolicyPackDetailKind {
  if (isSamplePrivacyPolicyPackId(policyPackId)) {
    return "healthcare-claims";
  }

  if (isResponsibleAiPolicyPackId(policyPackId)) {
    return "responsible-ai";
  }

  if (pack !== null && isPlatformDefaultResponsibleAiPack(pack)) {
    return "responsible-ai";
  }

  return "unknown";
}

export function resolvePolicyPackDetailBreadcrumbLabel(policyPackId: string, pack: PolicyPack | null): string {
  const kind = resolvePolicyPackDetailKind(policyPackId, pack);

  if (kind === "responsible-ai") {
    return RESPONSIBLE_AI_POLICY_PACK_BREADCRUMB_LABEL;
  }

  if (kind === "healthcare-claims") {
    return "Enterprise Privacy";
  }

  const packName = pack?.name?.trim() ?? "";

  if (packName.length > 0) {
    return packName;
  }

  return "Policy pack detail";
}

/**
 * Responsible AI is a first-party bundled platform default (see DEFAULT_POLICY_PACKS_V1.md).
 * Never label it "Sample" in buyer-facing UI — missing API rows are a loading gap, not demo content.
 */
export function isBundledResponsibleAiPlatformPack(policyPackId: string, pack: PolicyPack | null): boolean {
  if (pack !== null) {
    return isPlatformDefaultResponsibleAiPack(pack);
  }

  return isResponsibleAiPolicyPackId(policyPackId);
}
