import { describe, expect, it } from "vitest";

import {
  resolveTeamsIntegrationConnectSteps,
  resolveTeamsIntegrationEmphasizedStepId,
} from "@/lib/teams-integration-connect-checklist";

describe("teams-integration-connect-checklist", () => {
  it("emphasizes secret storage before test", () => {
    expect(
      resolveTeamsIntegrationEmphasizedStepId({
        secretNameConfigured: false,
        testSucceeded: false,
      }),
    ).toBe("secret");

    expect(
      resolveTeamsIntegrationEmphasizedStepId({
        secretNameConfigured: true,
        testSucceeded: false,
      }),
    ).toBe("test");
  });

  it("returns three connect steps", () => {
    const steps = resolveTeamsIntegrationConnectSteps({
      secretNameConfigured: true,
      testSucceeded: true,
    });

    expect(steps).toHaveLength(3);
    expect(steps.every((step) => step.complete)).toBe(true);
  });
});
