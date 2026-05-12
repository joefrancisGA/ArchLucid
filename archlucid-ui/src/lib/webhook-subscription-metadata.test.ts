import { describe, expect, it } from "vitest";

import {
  buildWebhookSubscriptionMetadata,
  summarizeMaskedWebhookSubscription,
  hasWebhookSecretConfigured,
  stripWebhookSecretsForDisplay,
} from "./webhook-subscription-metadata";

describe("webhook-subscription-metadata", () => {
  it("buildWebhookSubscriptionMetadata stores secret and unique event ids", () => {
    const json = buildWebhookSubscriptionMetadata("super-secret-shared-key", ["a", " b ", "a"]);
    const parsed = JSON.parse(json) as { webhookSharedSecret: string; eventTypes: string[] };

    expect(parsed.webhookSharedSecret).toBe("super-secret-shared-key");
    expect(parsed.eventTypes).toEqual(["a", "b"]);
  });

  it("summarizeMaskedWebhookSubscription hides secret literals", () => {
    const blob = JSON.stringify({
      webhookSharedSecret: "hunter2",
      eventTypes: ["archlucid.alert.recorded"],
      extraTenantNote: "ok",
    });
    const summary = summarizeMaskedWebhookSubscription(blob);

    expect(summary.secretStatus).toContain("Stored");
    expect(summary.eventTypes).toEqual(["archlucid.alert.recorded"]);
    expect(summary.displayMetadataJson).toContain("extraTenantNote");
    expect(summary.displayMetadataJson.includes("hunter2")).toBe(false);

    expect(stripWebhookSecretsForDisplay(blob).webhookSharedSecret).toBeUndefined();
    expect(hasWebhookSecretConfigured(blob)).toBe(true);
  });

  it("handles invalid json gracefully", () => {
    const summary = summarizeMaskedWebhookSubscription("{ not-json");

    expect(summary.displayMetadataJson).toBe("—");
    expect(summary.eventTypes.length).toBe(0);
    expect(hasWebhookSecretConfigured("")).toBe(false);
  });
});
