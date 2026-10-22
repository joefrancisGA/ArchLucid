import { describe, expect, it } from "vitest";

import {
  pathMatchesGovernanceAudit,
  pathMatchesGovernancePolicyPacks,
} from "@/lib/governance/governance-route-paths";

describe("use-app-shell-state route helpers", () => {
  it("matches governance audit and policy pack routes for footer suppression", () => {
    expect(pathMatchesGovernanceAudit("/governance/audit")).toBe(true);
    expect(pathMatchesGovernancePolicyPacks("/governance/policy-packs")).toBe(true);
    expect(pathMatchesGovernanceAudit("/architecture/reviews/new")).toBe(false);
  });
});
