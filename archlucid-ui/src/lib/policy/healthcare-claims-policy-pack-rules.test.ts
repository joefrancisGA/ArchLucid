import { describe, expect, it } from "vitest";

import { resolveHealthcareClaimsPolicyRuleRows } from "@/lib/policy/healthcare-claims-policy-pack-rules";

describe("resolveHealthcareClaimsPolicyRuleRows", () => {
  it("returns bundled template when no pack record exists", () => {
    const resolution = resolveHealthcareClaimsPolicyRuleRows(null, {
      hasPackRecord: false,
      packEnabled: false,
    });

    expect(resolution.rows.length).toBeGreaterThan(0);
    expect(resolution.rulesSourceQualifier).toMatch(/bundled template/i);
  });

  it("uses published qualifier when pack is not enabled", () => {
    const resolution = resolveHealthcareClaimsPolicyRuleRows(
      { complianceRuleKeys: ["phi.minimization.intake"], complianceRuleIds: [], alertRuleIds: [], compositeAlertRuleIds: [], advisoryDefaults: {}, metadata: {} },
      { hasPackRecord: true, packEnabled: false },
    );

    expect(resolution.rows.length).toBe(1);
    expect(resolution.rulesSourceQualifier).toMatch(/published rules/i);
  });
});
