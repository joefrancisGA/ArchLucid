import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_REMEDIATION_PATTERNS_PATH,
  SECURENOW_REMEDIATION_PATTERNS_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  isRemediationPatternsRoutePath,
  remediationPatternsPathForProductLine,
} from "@/lib/product-line/securenow-remediation-patterns-route";

describe("securenow-remediation-patterns-route", () => {
  it("routes SecureNow to /security/remediation-patterns and Architecture to governance", () => {
    expect(remediationPatternsPathForProductLine("security")).toBe(SECURENOW_REMEDIATION_PATTERNS_PATH);
    expect(remediationPatternsPathForProductLine("architecture")).toBe(GOVERNANCE_REMEDIATION_PATTERNS_PATH);
  });

  it("recognizes both remediation patterns route paths", () => {
    expect(isRemediationPatternsRoutePath(GOVERNANCE_REMEDIATION_PATTERNS_PATH)).toBe(true);
    expect(isRemediationPatternsRoutePath(SECURENOW_REMEDIATION_PATTERNS_PATH)).toBe(true);
    expect(isRemediationPatternsRoutePath("/governance/remediation-factory")).toBe(false);
  });
});
