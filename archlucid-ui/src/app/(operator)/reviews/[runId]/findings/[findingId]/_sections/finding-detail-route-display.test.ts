import { describe, expect, it } from "vitest";

import {
  buyerFindingDecisionImpactCopy,
  buyerFindingNextStepCopy,
} from "./finding-detail-route-display";

describe("finding-detail-route-display buyer summary copy", () => {
  it("returns decision impact and next step for the PHI showcase finding", () => {
    expect(buyerFindingDecisionImpactCopy(null, "phi-minimization-risk")).toContain("Non-blocking for package approval");
    expect(buyerFindingNextStepCopy(null, "phi-minimization-risk")).toContain("ingress classification");
  });
});
