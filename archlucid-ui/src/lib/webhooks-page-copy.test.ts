import { describe, expect, it } from "vitest";

import { webhookSettingsDefaultValues } from "@/lib/webhook-settings-form-schema";

import {
  WEBHOOKS_SIGNATURE_HEADER_NAME,
  WEBHOOKS_SIGNATURE_VALUE_PREFIX,
  describeWebhooksSaveReadinessMessage,
  webhooksConfigurationStatusLabel,
  webhooksConfigurationStatusTagKind,
} from "@/lib/webhooks-page-copy";

describe("webhooksConfigurationStatusLabel", () => {
  it("returns Not configured only when the workspace has no subscriptions", () => {
    expect(webhooksConfigurationStatusLabel(0, 0)).toBe("Not configured");
  });

  it("distinguishes saved-but-disabled subscriptions from an empty workspace", () => {
    expect(webhooksConfigurationStatusLabel(2, 0)).toBe("2 subscriptions, none enabled");
    expect(webhooksConfigurationStatusLabel(1, 0)).toBe("1 subscription, none enabled");
  });

  it("reports active subscription counts when at least one is enabled", () => {
    expect(webhooksConfigurationStatusLabel(3, 1)).toBe("1 active subscription");
    expect(webhooksConfigurationStatusLabel(3, 2)).toBe("2 active subscriptions");
  });
});

describe("webhooksConfigurationStatusTagKind", () => {
  it("marks empty and all-disabled workspaces as needs-attention", () => {
    expect(webhooksConfigurationStatusTagKind(0, 0)).toBe("needs-attention");
    expect(webhooksConfigurationStatusTagKind(2, 0)).toBe("needs-attention");
  });

  it("marks active subscriptions as ready", () => {
    expect(webhooksConfigurationStatusTagKind(2, 1)).toBe("ready");
  });
});

describe("describeWebhooksSaveReadinessMessage", () => {
  it("lists missing required fields for the default empty form", () => {
    expect(describeWebhooksSaveReadinessMessage(webhookSettingsDefaultValues)).toMatch(/subscription name/i);
    expect(describeWebhooksSaveReadinessMessage(webhookSettingsDefaultValues)).toMatch(/HTTPS destination URL/i);
    expect(describeWebhooksSaveReadinessMessage(webhookSettingsDefaultValues)).toMatch(/signing secret/i);
  });

  it("returns null when the form passes hard validation", () => {
    expect(
      describeWebhooksSaveReadinessMessage({
        ...webhookSettingsDefaultValues,
        name: "Pager hook",
        webhookUrl: "https://listener.example/webhook",
        secret: "z".repeat(16),
        eventTypes: ["archlucid.alert.recorded"],
      }),
    ).toBeNull();
  });
});

describe("webhook delivery contract copy", () => {
  it("uses the backend signature header name and prefix", () => {
    expect(WEBHOOKS_SIGNATURE_HEADER_NAME).toBe("X-ArchLucid-Webhook-Signature");
    expect(WEBHOOKS_SIGNATURE_VALUE_PREFIX).toBe("sha256=");
  });
});
