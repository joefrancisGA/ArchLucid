import { describe, expect, it } from "vitest";

import {
  resolveSecureNowCollectionPrimaryBlocker,
  resolveSecureNowCollectionYouAreHere,
} from "./securenow-collection-setup-checklist";

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

  it("returns you-are-here coordinates for the primary blocker", () => {
    const youAreHere = resolveSecureNowCollectionYouAreHere({
      hasConfiguredProvider: true,
      azureSubscriptionIdsPresent: false,
      hasSuccessfulPull: false,
    });

    expect(youAreHere).toMatchObject({
      stepIndex: 2,
      stepCount: 3,
      stepLabel: "Subscription scope selected",
      recoveryHref: "/integrations/cloud-connections/azure",
    });
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
