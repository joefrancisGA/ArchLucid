import { describe, expect, it } from "vitest";

import {
  buyerFindingDecisionImpactCopy,
  buyerFindingNextStepCopy,
  deriveFindingDecisionSummary,
} from "./finding-detail-route-display";

describe("finding-detail-route-display buyer summary copy", () => {
  it("returns decision impact and next step for the PHI showcase finding", () => {
    expect(buyerFindingDecisionImpactCopy(null, "phi-minimization-risk")).toContain("Non-blocking for package approval");
    expect(buyerFindingNextStepCopy(null, "phi-minimization-risk")).toContain("ingress classification");
  });

  it("derives compact decision summary for PHI showcase finding id", () => {
    const summary = deriveFindingDecisionSummary(null, "phi-minimization-risk");

    expect(summary.severity).toBeTruthy();
    expect(summary.disposition).toContain("monitoring");
    expect(summary.businessImpact).toContain("Non-blocking");
    expect(summary.requiredMonitoring.length).toBeGreaterThan(0);
    expect(summary.nextReview.length).toBeGreaterThan(0);
    expect(summary.riskOwner.length).toBeGreaterThan(0);
  });
});
