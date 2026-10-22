import { describe, expect, it } from "vitest";

import {
  resolveDigestSubscriptionCreateEmphasizedStepId,
  resolveDigestSubscriptionCreateSteps,
} from "@/lib/digest-subscription-create-checklist";

describe("resolveDigestSubscriptionCreateSteps", () => {
  it("emphasizes name before destination", () => {
    expect(
      resolveDigestSubscriptionCreateEmphasizedStepId({
        nameConfigured: false,
        destinationConfigured: false,
        subscriptionSaved: false,
      }),
    ).toBe("name");

    expect(
      resolveDigestSubscriptionCreateSteps({
        nameConfigured: true,
        destinationConfigured: false,
        subscriptionSaved: false,
      }).find((step) => step.id === "destination")?.complete,
    ).toBe(false);
  });
});
