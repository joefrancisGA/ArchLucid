import { describe, expect, it } from "vitest";

import { formatSecureNowCollectionSetupProgressSummary } from "@/lib/product-line/format-securenow-collection-setup-progress";

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
});
