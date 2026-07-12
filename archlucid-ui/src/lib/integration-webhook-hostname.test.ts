import { describe, expect, it } from "vitest";

import { isSlackIncomingWebhookHostname, isTeamsWebhookHostname } from "@/lib/integration-webhook-hostname";

describe("integration-webhook-hostname", () => {
  it("accepts only hooks.slack.com for Slack incoming webhooks", () => {
    expect(isSlackIncomingWebhookHostname("hooks.slack.com")).toBe(true);
    expect(isSlackIncomingWebhookHostname("evilhooks.slack.com")).toBe(false);
    expect(isSlackIncomingWebhookHostname("notslack.com")).toBe(false);
  });

  it("accepts Teams webhook hosts without substring false positives", () => {
    expect(isTeamsWebhookHostname("prod-12.webhook.office.com")).toBe(true);
    expect(isTeamsWebhookHostname("outlook.office.com")).toBe(true);
    expect(isTeamsWebhookHostname("evilwebhook.office.com.attacker.net")).toBe(false);
    expect(isTeamsWebhookHostname("notoffice.com")).toBe(false);
  });
});
