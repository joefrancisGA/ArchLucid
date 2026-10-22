import { describe, expect, it } from "vitest";

import { latestAlertRoutingConfigChange } from "@/lib/alert-routing-config-change";
import type { AlertRoutingSubscription } from "@/types/alert-routing";

function subscription(
  overrides: Partial<AlertRoutingSubscription> = {},
): AlertRoutingSubscription {
  return {
    routingSubscriptionId: "sub-1",
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    name: "Ops email",
    channelType: "Email",
    destination: "ops@example.com",
    minimumSeverity: "High",
    isEnabled: true,
    createdUtc: "2026-01-01T00:00:00.000Z",
    createdByActor: "alex@contoso.com",
    lastDeliveredUtc: null,
    metadataJson: "{}",
    ...overrides,
  };
}

describe("latestAlertRoutingConfigChange", () => {
  it("returns null when no destinations exist", () => {
    expect(latestAlertRoutingConfigChange([])).toBeNull();
  });

  it("prefers the latest toggle over an older create", () => {
    expect(
      latestAlertRoutingConfigChange([
        subscription({
          routingSubscriptionId: "sub-1",
          createdUtc: "2026-01-01T00:00:00.000Z",
          createdByActor: "creator@contoso.com",
        }),
        subscription({
          routingSubscriptionId: "sub-2",
          createdUtc: "2026-02-01T00:00:00.000Z",
          createdByActor: "creator@contoso.com",
          lastModifiedUtc: "2026-03-01T00:00:00.000Z",
          lastModifiedByActor: "operator@contoso.com",
        }),
      ]),
    ).toEqual({
      recordedUtc: "2026-03-01T00:00:00.000Z",
      actor: "operator@contoso.com",
    });
  });
});
