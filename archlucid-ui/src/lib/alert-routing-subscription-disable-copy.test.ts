import { describe, expect, it } from "vitest";

import {
  resolveAlertRoutingSubscriptionDisableDialogDescription,
  resolveAlertRoutingSubscriptionDisableDialogTitle,
} from "@/lib/alert-routing-subscription-disable-copy";

describe("alert-routing-subscription-disable-copy", () => {
  it("builds webhook disable dialog title and consequence copy", () => {
    expect(resolveAlertRoutingSubscriptionDisableDialogTitle("webhook", "Governance alerts")).toBe(
      "Disable webhook subscription Governance alerts?",
    );
    expect(resolveAlertRoutingSubscriptionDisableDialogDescription("webhook")).toContain(
      "Outbound HTTPS deliveries",
    );
  });

  it("builds Slack disable dialog title and consequence copy", () => {
    expect(resolveAlertRoutingSubscriptionDisableDialogTitle("slack", "Ops channel")).toBe(
      "Disable Slack destination Ops channel?",
    );
    expect(resolveAlertRoutingSubscriptionDisableDialogDescription("slack")).toContain("Slack channel");
  });
});
