import { describe, expect, it } from "vitest";

import {
  resolveSecureNowCollectionMissingDetail,
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
