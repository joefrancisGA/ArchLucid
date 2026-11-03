import { describe, expect, it } from "vitest";

import {
  formatSecureNowHomeSubscriptionScopeLine,
  resolveSecureNowCollectionMissingDetail,
  SECURENOW_COLLECTION_READER_ROLE_LINE,
  shouldShowSecureNowCollectionMissingBlock,
} from "@/lib/product-line/securenow-collection-missing-reason";

describe("resolveSecureNowCollectionMissingDetail", () => {
  it("names the reader role when no provider is configured", () => {
    expect(
      resolveSecureNowCollectionMissingDetail({
        hasConfiguredProvider: false,
        azureSubscriptionIdsPresent: false,
        hasSuccessfulPull: false,
      }),
    ).toMatch(/Reader role/i);
  });

  it("names missing subscription scope when the connection has no subscription ids", () => {
    expect(
      resolveSecureNowCollectionMissingDetail({
        hasConfiguredProvider: true,
        azureSubscriptionIdsPresent: false,
        hasSuccessfulPull: false,
      }),
    ).toMatch(/Subscription scope/i);
  });

  it("names a failed or unfinished capture when pull has not succeeded", () => {
    expect(
      resolveSecureNowCollectionMissingDetail({
        hasConfiguredProvider: true,
        azureSubscriptionIdsPresent: true,
        hasSuccessfulPull: false,
      }),
    ).toMatch(/capture failed or has not finished/i);
  });

  it("shows the block until a successful pull exists", () => {
    expect(
      shouldShowSecureNowCollectionMissingBlock({
        hasConfiguredProvider: true,
        azureSubscriptionIdsPresent: true,
        hasSuccessfulPull: false,
      }),
    ).toBe(true);
    expect(
      shouldShowSecureNowCollectionMissingBlock({
        hasConfiguredProvider: true,
        azureSubscriptionIdsPresent: true,
        hasSuccessfulPull: true,
      }),
    ).toBe(false);
  });
});

describe("SecureNow home collection missing copy", () => {
  it("names the reader role line used on Home and cloud connections", () => {
    expect(SECURENOW_COLLECTION_READER_ROLE_LINE).toMatch(/Reader on the subscription in scope/i);
  });

  it("formats subscription scope when the label is absent", () => {
    expect(formatSecureNowHomeSubscriptionScopeLine(null)).toBe("Subscription scope: not selected.");
    expect(formatSecureNowHomeSubscriptionScopeLine("  ")).toBe("Subscription scope: not selected.");
  });

  it("formats subscription scope when a label is present", () => {
    expect(formatSecureNowHomeSubscriptionScopeLine("Production")).toBe("Subscription scope: Production.");
  });
});
