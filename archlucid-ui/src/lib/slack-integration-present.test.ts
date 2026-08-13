import { describe, expect, it } from "vitest";

import {
  resolveSlackEmphasizedSetupStepId,
  resolveSlackSetupSteps,
} from "@/lib/slack-integration-present";

describe("resolveSlackSetupSteps", () => {
  it("returns four ordered setup steps", () => {
    const steps = resolveSlackSetupSteps({
      totalDestinationCount: 0,
      activeDestinationCount: 0,
      formTestSucceeded: false,
    });

    expect(steps).toHaveLength(4);
    expect(steps.map((step) => step.id)).toEqual([
      "create-webhook",
      "add-destination",
      "send-test",
      "save-destination",
    ]);
  });

  it("marks save complete when an active destination exists", () => {
    const steps = resolveSlackSetupSteps({
      totalDestinationCount: 1,
      activeDestinationCount: 1,
      formTestSucceeded: false,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
  });

  it("emphasizes save after a successful form test", () => {
    expect(
      resolveSlackEmphasizedSetupStepId({
        totalDestinationCount: 0,
        activeDestinationCount: 0,
        formTestSucceeded: true,
      }),
    ).toBe("save-destination");
  });
});
