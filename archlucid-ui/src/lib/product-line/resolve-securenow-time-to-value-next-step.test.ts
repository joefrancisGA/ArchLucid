import { describe, expect, it } from "vitest";

import {
  resolveSecureNowTimeToValueNextStep,
  resolveSecureNowTimeToValuePhase,
} from "@/lib/product-line/resolve-securenow-time-to-value-next-step";

describe("resolveSecureNowTimeToValueNextStep", () => {
  it("routes missing collection to cloud connections", () => {
    const phase = resolveSecureNowTimeToValuePhase({
      successfulCaptureCount: 0,
      collectionInput: {
        hasConfiguredProvider: false,
        azureSubscriptionIdsPresent: false,
        hasSuccessfulPull: false,
      },
    });

    expect(phase).toBe("needs-collection");
    expect(resolveSecureNowTimeToValueNextStep({ phase: phase! }).href).toContain("cloud-connections");
  });

  it("routes exactly one capture to second capture CTA", () => {
    const phase = resolveSecureNowTimeToValuePhase({
      successfulCaptureCount: 1,
      collectionInput: {
        hasConfiguredProvider: true,
        azureSubscriptionIdsPresent: true,
        hasSuccessfulPull: true,
      },
    });

    expect(phase).toBe("needs-second-capture");
  });
});
