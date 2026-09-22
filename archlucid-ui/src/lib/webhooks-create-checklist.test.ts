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
        subscriptionsLoaded: true,
      }),
    ).toBe("destination");

    expect(
      resolveWebhooksCreateEmphasizedStepId({
        destinationConfigured: true,
        eventsConfigured: false,
        subscriptionEnabled: false,
        subscriptionsLoaded: true,
      }),
    ).toBe("events");
  });

  it("does not mark enable step incomplete while subscriptions are still loading", () => {
    const steps = resolveWebhooksCreateSteps({
      destinationConfigured: true,
      eventsConfigured: true,
      subscriptionEnabled: false,
      subscriptionsLoaded: false,
    });

    expect(steps[2]?.complete).toBe(true);
  });

  it("returns three create steps", () => {
    const steps = resolveWebhooksCreateSteps({
      destinationConfigured: true,
      eventsConfigured: true,
      subscriptionEnabled: false,
      subscriptionsLoaded: true,
    });

    expect(steps).toHaveLength(3);
    expect(steps[2]?.complete).toBe(false);
  });
});
