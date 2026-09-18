import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
  SECURENOW_REMEDIATION_INSTANCES_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import {
  isRemediationInstancesRoutePath,
  remediationInstancesPathForProductLine,
} from "@/lib/product-line/securenow-remediation-instances-route";

describe("securenow-remediation-instances-route", () => {
  it("routes SecureNow to /security/remediation-instances and Architecture to governance", () => {
    expect(remediationInstancesPathForProductLine("security")).toBe(SECURENOW_REMEDIATION_INSTANCES_PATH);
    expect(remediationInstancesPathForProductLine("architecture")).toBe(GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH);
  });

  it("recognizes both remediation instances route paths", () => {
    expect(isRemediationInstancesRoutePath(GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH)).toBe(true);
    expect(isRemediationInstancesRoutePath(SECURENOW_REMEDIATION_INSTANCES_PATH)).toBe(true);
    expect(isRemediationInstancesRoutePath("/governance/remediation-factory")).toBe(false);
  });
});
