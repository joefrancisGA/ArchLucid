import { describe, expect, it } from "vitest";

import {
  resolveServiceNowIntegrationConnectSteps,
  resolveServiceNowIntegrationEmphasizedStepId,
} from "@/lib/servicenow-integration-connect-checklist";

describe("servicenow-integration-connect-checklist", () => {
  it("emphasizes connect before destination and test", () => {
    expect(
      resolveServiceNowIntegrationEmphasizedStepId({
        credentialsReady: false,
        destinationConfigured: false,
        connectionVerified: false,
      }),
    ).toBe("connect");

    expect(
      resolveServiceNowIntegrationEmphasizedStepId({
        credentialsReady: true,
        destinationConfigured: false,
        connectionVerified: false,
      }),
    ).toBe("destination");
  });

  it("returns three checklist steps", () => {
    const steps = resolveServiceNowIntegrationConnectSteps({
      credentialsReady: true,
      destinationConfigured: true,
      connectionVerified: true,
    });

    expect(steps.map((step) => step.id)).toEqual(["connect", "destination", "test"]);
    expect(steps.every((step) => step.complete)).toBe(true);
  });
});
