import { describe, expect, it } from "vitest";

import {
  resolveCloudConnectionsConnectSteps,
  resolveCloudConnectionsEmphasizedStepId,
} from "@/lib/cloud-connections-connect-checklist";

describe("cloud-connections-connect-checklist", () => {
  it("emphasizes the first incomplete step", () => {
    expect(
      resolveCloudConnectionsEmphasizedStepId({
        providerSelected: true,
        connectionConfigured: false,
        connectionValidated: false,
      }),
    ).toBe("configure");

    const steps = resolveCloudConnectionsConnectSteps({
      providerSelected: false,
      connectionConfigured: false,
      connectionValidated: false,
    });

    expect(steps).toHaveLength(3);
  });
});
