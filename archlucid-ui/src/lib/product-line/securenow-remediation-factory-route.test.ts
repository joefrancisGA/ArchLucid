import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_REMEDIATION_FACTORY_PATH,
  SECURENOW_REMEDIATION_FACTORY_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  isRemediationFactoryRoutePath,
  remediationFactoryPathForProductLine,
} from "@/lib/product-line/securenow-remediation-factory-route";

describe("securenow-remediation-factory-route", () => {
  it("routes SecureNow to /security/remediation-factory and Architecture to governance", () => {
    expect(remediationFactoryPathForProductLine("security")).toBe(SECURENOW_REMEDIATION_FACTORY_PATH);
    expect(remediationFactoryPathForProductLine("architecture")).toBe(GOVERNANCE_REMEDIATION_FACTORY_PATH);
  });

  it("recognizes both remediation factory route paths", () => {
    expect(isRemediationFactoryRoutePath(GOVERNANCE_REMEDIATION_FACTORY_PATH)).toBe(true);
    expect(isRemediationFactoryRoutePath(SECURENOW_REMEDIATION_FACTORY_PATH)).toBe(true);
    expect(isRemediationFactoryRoutePath("/governance/remediation-patterns")).toBe(false);
  });
});
