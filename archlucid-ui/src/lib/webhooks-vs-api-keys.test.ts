import { describe, expect, it } from "vitest";

import { API_KEYS_SETTINGS_CANONICAL_PATH } from "@/lib/api-keys-settings-evidence-copy";
import { INTEGRATIONS_WEBHOOKS_PATH } from "@/lib/integrations-nav-paths";
import {
  WEBHOOKS_VS_API_KEYS_API_KEYS_LINK,
  WEBHOOKS_VS_API_KEYS_COMPACT_LINE,
  WEBHOOKS_VS_API_KEYS_HEADING,
  WEBHOOKS_VS_API_KEYS_WEBHOOKS_LINK,
  WEBHOOKS_VS_API_KEYS_WHY_TWO,
  buildWebhooksVsApiKeysReconciler,
  resolveWebhooksVsApiKeysPeerLink,
} from "@/lib/webhooks-vs-api-keys";

describe("webhooks-vs-api-keys (TB-2242)", () => {
  it("explains why webhooks and API keys stay separate and deep-links both", () => {
    const model = buildWebhooksVsApiKeysReconciler();

    expect(model.heading).toBe(WEBHOOKS_VS_API_KEYS_HEADING);
    expect(model.whyTwo).toBe(WEBHOOKS_VS_API_KEYS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("webhook");
    expect(model.whyTwo.toLowerCase()).toContain("api key");
    expect(model.compactLine).toBe(WEBHOOKS_VS_API_KEYS_COMPACT_LINE);

    expect(model.webhooksLink).toEqual(WEBHOOKS_VS_API_KEYS_WEBHOOKS_LINK);
    expect(model.webhooksLink.href).toBe(INTEGRATIONS_WEBHOOKS_PATH);
    expect(model.webhooksLink.href).toBe("/integrations/webhooks");

    expect(model.apiKeysLink).toEqual(WEBHOOKS_VS_API_KEYS_API_KEYS_LINK);
    expect(model.apiKeysLink.href).toBe(API_KEYS_SETTINGS_CANONICAL_PATH);
    expect(model.apiKeysLink.href).toBe("/administration/api-keys");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolveWebhooksVsApiKeysPeerLink("webhooks")).toEqual(WEBHOOKS_VS_API_KEYS_API_KEYS_LINK);
    expect(resolveWebhooksVsApiKeysPeerLink("api-keys")).toEqual(WEBHOOKS_VS_API_KEYS_WEBHOOKS_LINK);
  });
});
