import { describe, expect, it } from "vitest";

import {
  resolveSlackIntegrationConnectSteps,
  resolveSlackIntegrationEmphasizedStepId,
} from "@/lib/slack-integration-connect-checklist";

describe("slack-integration-connect-checklist", () => {
  it("emphasizes connect before destination and test", () => {
    expect(
      resolveSlackIntegrationEmphasizedStepId({
        totalDestinationCount: 0,
        activeDestinationCount: 0,
        formTestSucceeded: false,
      }),
    ).toBe("connect");

    expect(
      resolveSlackIntegrationEmphasizedStepId({
        totalDestinationCount: 1,
        activeDestinationCount: 0,
        formTestSucceeded: false,
      }),
    ).toBe("destination");
  });

  it("returns three checklist steps", () => {
    const steps = resolveSlackIntegrationConnectSteps({
      totalDestinationCount: 1,
      activeDestinationCount: 1,
      formTestSucceeded: true,
    });

    expect(steps.map((step) => step.id)).toEqual(["connect", "destination", "test"]);
    expect(steps.every((step) => step.complete)).toBe(true);
  });
});
