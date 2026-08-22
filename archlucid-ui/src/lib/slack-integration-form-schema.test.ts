import { describe, expect, it } from "vitest";

import { slackIntegrationFormSchema } from "@/lib/slack-integration-form-schema";

describe("slackIntegrationFormSchema", () => {
  it("accepts a valid Slack destination without a signing secret", () => {
    const parsed = slackIntegrationFormSchema.safeParse({
      name: "Policy alerts",
      webhookUrl: "https://hooks.slack.com/services/T000/B000/XXXXXXXX",
      secret: "",
      minimumSeverity: "High",
      eventTypes: ["archlucid.alert.recorded"],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects non-Slack webhook URLs", () => {
    const parsed = slackIntegrationFormSchema.safeParse({
      name: "Policy alerts",
      webhookUrl: "https://example.com/webhook",
      secret: "",
      minimumSeverity: "High",
      eventTypes: ["archlucid.alert.recorded"],
    });

    expect(parsed.success).toBe(false);
  });

  it("requires at least one notification type", () => {
    const parsed = slackIntegrationFormSchema.safeParse({
      name: "Policy alerts",
      webhookUrl: "https://hooks.slack.com/services/T000/B000/XXXXXXXX",
      secret: "",
      minimumSeverity: "High",
      eventTypes: [],
    });

    expect(parsed.success).toBe(false);
  });
});
