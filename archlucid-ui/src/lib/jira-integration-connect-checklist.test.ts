import { describe, expect, it } from "vitest";

import {
  resolveJiraIntegrationConnectSteps,
  resolveJiraIntegrationEmphasizedStepId,
} from "@/lib/jira-integration-connect-checklist";

describe("jira-integration-connect-checklist", () => {
  it("emphasizes connect before destination and test", () => {
    expect(
      resolveJiraIntegrationEmphasizedStepId({
        oauthConnectReady: false,
        credentialsReady: false,
        connectionVerified: false,
      }),
    ).toBe("connect");

    expect(
      resolveJiraIntegrationEmphasizedStepId({
        oauthConnectReady: true,
        credentialsReady: false,
        connectionVerified: false,
      }),
    ).toBe("destination");
  });

  it("returns three checklist steps", () => {
    const steps = resolveJiraIntegrationConnectSteps({
      oauthConnectReady: true,
      credentialsReady: true,
      connectionVerified: true,
    });

    expect(steps.map((step) => step.id)).toEqual(["connect", "destination", "test"]);
    expect(steps.every((step) => step.complete)).toBe(true);
  });
});
