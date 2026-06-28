import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_RESOLUTION_PATH,
  governanceAlertsTabHref,
  governancePolicyPackDetailPath,
  pathMatchesGovernanceAlerts,
  pathMatchesGovernanceAudit,
  pathMatchesGovernancePolicyPacks,
  pathMatchesGovernanceResolution,
} from "@/lib/governance-route-paths";

describe("governance-route-paths (TB-405)", () => {
  it("exposes canonical governance hrefs under /governance/*", () => {
    expect(GOVERNANCE_POLICY_PACKS_PATH).toBe("/governance/policy-packs");
    expect(GOVERNANCE_RESOLUTION_PATH).toBe("/governance/resolution");
    expect(GOVERNANCE_AUDIT_PATH).toBe("/governance/audit");
    expect(GOVERNANCE_ALERTS_PATH).toBe("/governance/alerts");
  });

  it("matches canonical and legacy policy pack paths", () => {
    expect(pathMatchesGovernancePolicyPacks("/governance/policy-packs")).toBe(true);
    expect(pathMatchesGovernancePolicyPacks("/policy-packs")).toBe(true);
    expect(pathMatchesGovernancePolicyPacks("/governance")).toBe(false);
  });

  it("matches canonical and legacy audit, alerts, and resolution paths", () => {
    expect(pathMatchesGovernanceAudit("/governance/audit")).toBe(true);
    expect(pathMatchesGovernanceAudit("/audit")).toBe(true);
    expect(pathMatchesGovernanceAlerts("/governance/alerts")).toBe(true);
    expect(pathMatchesGovernanceAlerts("/alerts")).toBe(true);
    expect(pathMatchesGovernanceResolution("/governance/resolution")).toBe(true);
    expect(pathMatchesGovernanceResolution("/governance-resolution")).toBe(true);
  });

  it("builds detail and tab hrefs on canonical paths", () => {
    expect(governancePolicyPackDetailPath("pack-1")).toBe("/governance/policy-packs/pack-1");
    expect(governanceAlertsTabHref("rules")).toBe("/governance/alerts?tab=rules");
  });
});
