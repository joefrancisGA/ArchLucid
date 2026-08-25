import { describe, expect, it } from "vitest";

import {
  resolveWebhooksCreateEmphasizedStepId,
  resolveWebhooksCreateSteps,
} from "@/lib/webhooks-create-checklist";

describe("webhooks-create-checklist", () => {
  it("emphasizes the first incomplete step", () => {
    expect(
      resolveWebhooksCreateEmphasizedStepId({
        destinationConfigured: false,
        eventsConfigured: false,
        subscriptionEnabled: false,
      }),
    ).toBe("destination");

    expect(
      resolveWebhooksCreateEmphasizedStepId({
        destinationConfigured: true,
        eventsConfigured: false,
        subscriptionEnabled: false,
      }),
    ).toBe("events");
  });

  it("returns three create steps", () => {
    const steps = resolveWebhooksCreateSteps({
      destinationConfigured: true,
      eventsConfigured: true,
      subscriptionEnabled: false,
    });

    expect(steps).toHaveLength(3);
    expect(steps[2]?.complete).toBe(false);
  });
});
