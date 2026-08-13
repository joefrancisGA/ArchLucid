import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_ACTION_REGION_TITLE,
  validateRemediationOwnerInput,
} from "@/lib/findings/finding-governance-action-copy";

describe("finding-governance-action-copy", () => {
  it("exposes governance region title", () => {
    expect(GOVERNANCE_ACTION_REGION_TITLE).toBe("Take governance action");
  });

  it("accepts email remediation owners", () => {
    expect(validateRemediationOwnerInput("owner@example.com")).toBeNull();
  });

  it("rejects obviously invalid owners", () => {
    expect(validateRemediationOwnerInput("x")).toMatch(/valid/i);
  });
});
