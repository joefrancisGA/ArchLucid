import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  assignedToMeFindingsPathForProductLine,
  isAssignedToMeFindingsRoutePath,
} from "@/lib/product-line/securenow-assigned-to-me-route";

describe("securenow-assigned-to-me-route", () => {
  it("routes SecureNow to /security/assigned-to-me and Architecture to governance", () => {
    expect(assignedToMeFindingsPathForProductLine("security")).toBe(SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH);
    expect(assignedToMeFindingsPathForProductLine("architecture")).toBe(GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH);
  });

  it("recognizes both assigned-to-me route paths", () => {
    expect(isAssignedToMeFindingsRoutePath(GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH)).toBe(true);
    expect(isAssignedToMeFindingsRoutePath(SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH)).toBe(true);
    expect(isAssignedToMeFindingsRoutePath("/governance/findings")).toBe(false);
  });
});
