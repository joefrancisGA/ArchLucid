import { describe, expect, it } from "vitest";

import {
  isOrganizationPrivatePolicyPackDistributionScope,
  policyPackDistributionScopeBuyerLabel,
} from "@/lib/policy/policy-pack-distribution-scope-label";
import { POLICY_PACK_DISTRIBUTION_SCOPE_ORGANIZATION_PRIVATE } from "@/lib/policy/policy-pack-distribution-scope-constants";

describe("policyPackDistributionScopeBuyerLabel", () => {
  it("labels organization private scope for buyers", () => {
    expect(policyPackDistributionScopeBuyerLabel(POLICY_PACK_DISTRIBUTION_SCOPE_ORGANIZATION_PRIVATE)).toBe(
      "Organization private",
    );
  });

  it("returns null for platform scope", () => {
    expect(policyPackDistributionScopeBuyerLabel("Platform")).toBeNull();
  });
});

describe("isOrganizationPrivatePolicyPackDistributionScope", () => {
  it("detects organization private packs", () => {
    expect(isOrganizationPrivatePolicyPackDistributionScope(POLICY_PACK_DISTRIBUTION_SCOPE_ORGANIZATION_PRIVATE)).toBe(
      true,
    );
  });
});
