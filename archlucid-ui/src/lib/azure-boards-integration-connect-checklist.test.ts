import { describe, expect, it } from "vitest";

import {
  resolveAzureBoardsIntegrationConnectSteps,
  resolveAzureBoardsIntegrationEmphasizedStepId,
} from "@/lib/azure-boards-integration-connect-checklist";

describe("azure-boards-integration-connect-checklist", () => {
  it("emphasizes the first incomplete setup step", () => {
    expect(
      resolveAzureBoardsIntegrationEmphasizedStepId({
        credentialsReady: true,
        settingsReady: false,
        connectionVerified: false,
      }),
    ).toBe("destination");
  });

  it("returns three connect checklist steps", () => {
    const steps = resolveAzureBoardsIntegrationConnectSteps({
      credentialsReady: false,
      settingsReady: false,
      connectionVerified: false,
    });

    expect(steps.map((step) => step.id)).toEqual(["connect", "destination", "test"]);
  });
});
