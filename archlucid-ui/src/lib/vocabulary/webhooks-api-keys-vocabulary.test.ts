import { describe, expect, it } from "vitest";

import {
  WEBHOOKS_API_KEYS_API_KEYS_LINK,
  WEBHOOKS_API_KEYS_COMPACT_LINE,
  WEBHOOKS_API_KEYS_HEADING,
  WEBHOOKS_API_KEYS_WEBHOOKS_LINK,
  WEBHOOKS_API_KEYS_WHY_TWO,
  buildWebhooksApiKeysVocabulary,
  resolveWebhooksApiKeysPeerLink,
} from "@/lib/vocabulary/webhooks-api-keys-vocabulary";
import { API_KEYS_SETTINGS_CANONICAL_PATH } from "@/lib/api-keys-settings-evidence-copy";
import { INTEGRATIONS_WEBHOOKS_PATH } from "@/lib/integrations-nav-paths";

describe("webhooks-api-keys-vocabulary (TB-2320)", () => {
  it("explains outbound webhooks vs API key credentials", () => {
    const model = buildWebhooksApiKeysVocabulary();

    expect(model.heading).toBe(WEBHOOKS_API_KEYS_HEADING);
    expect(model.heading.toLowerCase()).toContain("webhooks");
    expect(model.heading.toLowerCase()).toContain("api keys");
    expect(model.whyTwo).toBe(WEBHOOKS_API_KEYS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("push");
    expect(model.whyTwo.toLowerCase()).toContain("credentials");
    expect(model.compactLine).toBe(WEBHOOKS_API_KEYS_COMPACT_LINE);

    expect(model.webhooksLink).toEqual(WEBHOOKS_API_KEYS_WEBHOOKS_LINK);
    expect(model.webhooksLink.href).toBe(INTEGRATIONS_WEBHOOKS_PATH);

    expect(model.apiKeysLink).toEqual(WEBHOOKS_API_KEYS_API_KEYS_LINK);
    expect(model.apiKeysLink.href).toBe(API_KEYS_SETTINGS_CANONICAL_PATH);
  });

  it("resolves the peer surface from webhooks and api-keys", () => {
    expect(resolveWebhooksApiKeysPeerLink("webhooks")).toEqual(WEBHOOKS_API_KEYS_API_KEYS_LINK);
    expect(resolveWebhooksApiKeysPeerLink("api-keys")).toEqual(WEBHOOKS_API_KEYS_WEBHOOKS_LINK);
  });
});
