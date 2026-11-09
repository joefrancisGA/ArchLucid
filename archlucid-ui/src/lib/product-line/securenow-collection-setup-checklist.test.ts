import { describe, expect, it } from "vitest";

import { resolveSecureNowCollectionPrimaryBlocker } from "./securenow-collection-setup-checklist";

describe("resolveSecureNowCollectionPrimaryBlocker", () => {
  it("returns null when collection setup is complete", () => {
    expect(
      resolveSecureNowCollectionPrimaryBlocker({
        hasConfiguredProvider: true,
        azureSubscriptionIdsPresent: true,
        hasSuccessfulPull: true,
      }),
    ).toBeNull();
  });

  it("returns the first incomplete step as the blocker", () => {
    const blocker = resolveSecureNowCollectionPrimaryBlocker({
      hasConfiguredProvider: false,
      azureSubscriptionIdsPresent: false,
      hasSuccessfulPull: false,
    });

    expect(blocker).toMatchObject({
      stepId: "provider",
      stepLabel: "Cloud provider configured",
      recoveryHref: "/integrations/cloud-connections#cloud-connections-options-heading",
    });
    expect(blocker?.detail).toMatch(/not configured/i);
  });

  it("deep-links subscription and capture blockers", () => {
    expect(
      resolveSecureNowCollectionPrimaryBlocker({
        hasConfiguredProvider: true,
        azureSubscriptionIdsPresent: false,
        hasSuccessfulPull: false,
      })?.recoveryHref,
    ).toBe("/integrations/cloud-connections/azure");
    expect(
      resolveSecureNowCollectionPrimaryBlocker({
        hasConfiguredProvider: true,
        azureSubscriptionIdsPresent: true,
        hasSuccessfulPull: false,
      })?.recoveryHref,
    ).toBe("/administration/connection-status");
  });
});
