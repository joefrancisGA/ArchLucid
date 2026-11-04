import { describe, expect, it } from "vitest";

import {
  resolveSecureNowCollectionSetupEmphasizedStepId,
  resolveSecureNowCollectionSetupSteps,
} from "@/lib/product-line/securenow-collection-setup-checklist";

describe("securenow-collection-setup-checklist", () => {
  it("orders provider, subscription, and capture steps", () => {
    const steps = resolveSecureNowCollectionSetupSteps({
      hasConfiguredProvider: true,
      azureSubscriptionIdsPresent: false,
      hasSuccessfulPull: false,
    });

    expect(steps.map((step) => step.id)).toEqual(["provider", "subscription", "capture"]);
    expect(steps[0]?.complete).toBe(true);
    expect(steps[1]?.complete).toBe(false);
  });

  it("emphasizes the first incomplete step", () => {
    expect(
      resolveSecureNowCollectionSetupEmphasizedStepId({
        hasConfiguredProvider: false,
        azureSubscriptionIdsPresent: false,
        hasSuccessfulPull: false,
      }),
    ).toBe("provider");
    expect(
      resolveSecureNowCollectionSetupEmphasizedStepId({
        hasConfiguredProvider: true,
        azureSubscriptionIdsPresent: true,
        hasSuccessfulPull: false,
      }),
    ).toBe("capture");
  });
});
