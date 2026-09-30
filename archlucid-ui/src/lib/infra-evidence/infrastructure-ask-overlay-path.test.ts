import { describe, expect, it } from "vitest";

import { isInfrastructureAskOverlayEligiblePath } from "@/lib/infra-evidence/infrastructure-ask-overlay-path";

describe("isInfrastructureAskOverlayEligiblePath", () => {
  it("allows diagram and drift workbenches", () => {
    expect(isInfrastructureAskOverlayEligiblePath("/infrastructure/diagrams")).toBe(true);
    expect(isInfrastructureAskOverlayEligiblePath("/governance/infrastructure/drift")).toBe(true);
  });

  it("disallows overview, Ask page, and non-infrastructure routes", () => {
    expect(isInfrastructureAskOverlayEligiblePath("/infrastructure")).toBe(false);
    expect(isInfrastructureAskOverlayEligiblePath("/infrastructure/ask")).toBe(false);
    expect(isInfrastructureAskOverlayEligiblePath("/governance/findings")).toBe(false);
  });
});
