import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_POLICY_PACKS_PAGE_LEAD,
  SECURENOW_GOVERNANCE_POLICY_PACKS_PAGE_LEAD,
  resolveGovernancePolicyPacksPageLead,
} from "@/lib/governance-policy-packs-page-copy";

describe("governance-policy-packs-page-copy", () => {
  it("uses SecureNow page lead without architecture review language", () => {
    expect(resolveGovernancePolicyPacksPageLead("security")).toBe(SECURENOW_GOVERNANCE_POLICY_PACKS_PAGE_LEAD);
    expect(SECURENOW_GOVERNANCE_POLICY_PACKS_PAGE_LEAD).toContain("cloud evidence scans");
    expect(SECURENOW_GOVERNANCE_POLICY_PACKS_PAGE_LEAD).not.toContain("architecture reviews");
  });

  it("keeps architecture page lead unchanged", () => {
    expect(resolveGovernancePolicyPacksPageLead("architecture")).toBe(GOVERNANCE_POLICY_PACKS_PAGE_LEAD);
  });
});
