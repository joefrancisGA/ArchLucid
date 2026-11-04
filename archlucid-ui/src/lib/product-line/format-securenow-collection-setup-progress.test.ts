import { describe, expect, it } from "vitest";

import {
  formatSecureNowCollectionSetupProgressSummary,
  isSecureNowCollectionSetupComplete,
} from "@/lib/product-line/format-securenow-collection-setup-progress";

describe("formatSecureNowCollectionSetupProgressSummary", () => {
  it("reports completed steps out of three", () => {
    expect(
      formatSecureNowCollectionSetupProgressSummary({
        hasConfiguredProvider: true,
        azureSubscriptionIdsPresent: true,
        hasSuccessfulPull: false,
      }),
    ).toBe("Collection setup: 2 of 3 complete.");
  });

  it("is complete only when provider, scope, and capture succeeded", () => {
    expect(
      isSecureNowCollectionSetupComplete({
        hasConfiguredProvider: true,
        azureSubscriptionIdsPresent: true,
        hasSuccessfulPull: true,
      }),
    ).toBe(true);
    expect(
      isSecureNowCollectionSetupComplete({
        hasConfiguredProvider: true,
        azureSubscriptionIdsPresent: true,
        hasSuccessfulPull: false,
      }),
    ).toBe(false);
  });
});
