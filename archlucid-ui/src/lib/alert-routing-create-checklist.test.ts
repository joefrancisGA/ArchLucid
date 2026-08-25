import { describe, expect, it } from "vitest";

import {
  resolveAlertRoutingCreateEmphasizedStepId,
  resolveAlertRoutingCreateSteps,
} from "@/lib/alert-routing-create-checklist";

describe("resolveAlertRoutingCreateSteps", () => {
  it("emphasizes channel before destination", () => {
    expect(
      resolveAlertRoutingCreateEmphasizedStepId({
        channelConfigured: false,
        destinationConfigured: false,
        destinationSaved: false,
      }),
    ).toBe("channel");

    expect(
      resolveAlertRoutingCreateSteps({
        channelConfigured: true,
        destinationConfigured: false,
        destinationSaved: false,
      }).find((step) => step.id === "destination")?.complete,
    ).toBe(false);
  });
});
