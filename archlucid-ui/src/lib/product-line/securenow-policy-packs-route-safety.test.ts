import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_POLICY_PACKS_PATH,
  SECURENOW_POLICY_PACKS_PATH,
} from "@/lib/governance/governance-route-paths";
import { isPathAllowedForProductLine } from "@/lib/product-line/product-line-path-access";
import { policyPacksPathForProductLine } from "@/lib/product-line/securenow-compliance-routes";

describe("securenow-policy-packs-route-safety", () => {
  it("routes SecureNow to /compliance/policy-packs only", () => {
    expect(policyPacksPathForProductLine("security")).toBe(SECURENOW_POLICY_PACKS_PATH);
    expect(policyPacksPathForProductLine("architecture")).toBe(GOVERNANCE_POLICY_PACKS_PATH);
  });

  it("gates SecureNow compliance policy packs path by product line", () => {
    expect(isPathAllowedForProductLine(SECURENOW_POLICY_PACKS_PATH, "security")).toBe(true);
    expect(isPathAllowedForProductLine(SECURENOW_POLICY_PACKS_PATH, "architecture")).toBe(false);
    expect(isPathAllowedForProductLine(GOVERNANCE_POLICY_PACKS_PATH, "architecture")).toBe(true);
    expect(isPathAllowedForProductLine(GOVERNANCE_POLICY_PACKS_PATH, "security")).toBe(true);
  });
});
