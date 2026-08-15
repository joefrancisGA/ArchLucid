import type { PolicyPack } from "@/types/policy-packs";

import { isActiveSamplePolicyPackId } from "@/lib/samples/registry";
import { RESPONSIBLE_AI_POLICY_PACK_BREADCRUMB_LABEL } from "@/lib/responsible-ai-policy-pack-detail-content";

export type PolicyPackDetailKind = "responsible-ai" | "healthcare-claims" | "unknown";

const RESPONSIBLE_AI_POLICY_PACK_ID_ALIASES = new Set([
  "1",
  "ai-governance-responsible-ai",
  "ai-governance-responsible-ai-v1",
  "responsible-ai",
  "responsible-ai-v1",
]);

function normalizePolicyPackToken(value: string): string {
  return value.trim().toLowerCase();
}

function isHealthcareClaimsPolicyPackId(policyPackId: string): boolean {
  return isActiveSamplePolicyPackId(policyPackId);
}

function isResponsibleAiPolicyPackName(name: string): boolean {
  const normalized = normalizePolicyPackToken(name);

  return normalized.includes("responsible ai") || normalized.includes("ai governance");
}

export function isResponsibleAiPolicyPackId(policyPackId: string): boolean {
  const normalized = normalizePolicyPackToken(policyPackId);

  if (RESPONSIBLE_AI_POLICY_PACK_ID_ALIASES.has(normalized)) {
    return true;
  }

  return normalized.includes("responsible-ai") || normalized.includes("ai-governance");
}

export function resolvePolicyPackDetailKind(policyPackId: string, pack: PolicyPack | null): PolicyPackDetailKind {
  if (isHealthcareClaimsPolicyPackId(policyPackId)) {
    return "healthcare-claims";
  }

  if (isResponsibleAiPolicyPackId(policyPackId)) {
    return "responsible-ai";
  }

  if (pack !== null && isResponsibleAiPolicyPackName(pack.name)) {
    return "responsible-ai";
  }

  if (pack !== null && isHealthcareClaimsPolicyPackId(pack.name)) {
    return "healthcare-claims";
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
    return (pack.packType?.trim() ?? "") === "PlatformDefault";
  }

  return isResponsibleAiPolicyPackId(policyPackId);
}
