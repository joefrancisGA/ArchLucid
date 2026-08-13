import { POLICY_PACK_DISTRIBUTION_SCOPE_ORGANIZATION_PRIVATE } from "@/lib/policy/policy-pack-distribution-scope-constants";

/**
 * Buyer-facing label for {@link PolicyPack.distributionScope}.
 */
export function policyPackDistributionScopeBuyerLabel(distributionScopeRaw: string | undefined): string | null {
  const scope = (distributionScopeRaw ?? "").trim();

  if (scope === POLICY_PACK_DISTRIBUTION_SCOPE_ORGANIZATION_PRIVATE) {
    return "Organization private";
  }

  return null;
}

export function isOrganizationPrivatePolicyPackDistributionScope(distributionScopeRaw: string | undefined): boolean {
  return (distributionScopeRaw ?? "").trim() === POLICY_PACK_DISTRIBUTION_SCOPE_ORGANIZATION_PRIVATE;
}

/** Short helper copy for custom packs — packs never leave the organization. */
export const POLICY_PACK_ORGANIZATION_PRIVATE_HELPER_COPY =
  "This pack is organization private: it is not published, not discoverable outside your tenant, and is not used to train or improve other customers' packs.";
