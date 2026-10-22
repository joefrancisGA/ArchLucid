import { describe, expect, it } from "vitest";

import { resolveOperatorHomeContinueSetupPlacement } from "./resolve-operator-home-continue-setup-placement";

describe("resolveOperatorHomeContinueSetupPlacement", () => {
  it("surfaces Continue setup prominently while readiness is still loading", () => {
    expect(
      resolveOperatorHomeContinueSetupPlacement({
        phase: "loading",
        readyCount: 0,
        totalCount: 4,
        requiredStepsComplete: false,
      }),
    ).toBe("prominent");
  });

  it("surfaces Continue setup prominently when required setup steps remain", () => {
    expect(
      resolveOperatorHomeContinueSetupPlacement({
        phase: "ready",
        readyCount: 2,
        totalCount: 4,
        requiredStepsComplete: false,
      }),
    ).toBe("prominent");
  });

  it("hides Continue setup when required steps are complete", () => {
    expect(
      resolveOperatorHomeContinueSetupPlacement({
        phase: "ready",
        readyCount: 3,
        totalCount: 4,
        requiredStepsComplete: true,
      }),
    ).toBe("hidden");
  });

  it("hides Continue setup when every tracked setup step is complete", () => {
    expect(
      resolveOperatorHomeContinueSetupPlacement({
        phase: "ready",
        readyCount: 4,
        totalCount: 4,
        requiredStepsComplete: false,
      }),
    ).toBe("hidden");
  });
});
