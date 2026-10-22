import { describe, expect, it } from "vitest";

import {
  CONNECTION_STATUS_WEBHOOKS_COMPACT_LINE,
  CONNECTION_STATUS_WEBHOOKS_HEADING,
  CONNECTION_STATUS_WEBHOOKS_STATUS_LINK,
  CONNECTION_STATUS_WEBHOOKS_WEBHOOKS_LINK,
  CONNECTION_STATUS_WEBHOOKS_WHY_TWO,
  buildConnectionStatusWebhooksVocabulary,
  resolveConnectionStatusWebhooksPeerLink,
} from "@/lib/vocabulary/connection-status-webhooks-vocabulary";
import {
  ADMINISTRATION_CONNECTION_STATUS_PATH,
  INTEGRATIONS_WEBHOOKS_PATH,
} from "@/lib/integrations-nav-paths";

describe("connection-status-webhooks-vocabulary (TB-2301)", () => {
  it("explains integration readiness vs webhook subscription editing", () => {
    const model = buildConnectionStatusWebhooksVocabulary();

    expect(model.heading).toBe(CONNECTION_STATUS_WEBHOOKS_HEADING);
    expect(model.whyTwo).toBe(CONNECTION_STATUS_WEBHOOKS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("ready");
    expect(model.whyTwo.toLowerCase()).toContain("subscription");
    expect(model.compactLine).toBe(CONNECTION_STATUS_WEBHOOKS_COMPACT_LINE);

    expect(model.connectionStatusLink).toEqual(CONNECTION_STATUS_WEBHOOKS_STATUS_LINK);
    expect(model.connectionStatusLink.href).toBe(ADMINISTRATION_CONNECTION_STATUS_PATH);
    expect(model.webhooksLink).toEqual(CONNECTION_STATUS_WEBHOOKS_WEBHOOKS_LINK);
    expect(model.webhooksLink.href).toBe(INTEGRATIONS_WEBHOOKS_PATH);
  });

  it("resolves the peer surface from connection status and webhooks", () => {
    expect(resolveConnectionStatusWebhooksPeerLink("connection-status")).toEqual(
      CONNECTION_STATUS_WEBHOOKS_WEBHOOKS_LINK,
    );

    expect(resolveConnectionStatusWebhooksPeerLink("webhooks")).toEqual(
      CONNECTION_STATUS_WEBHOOKS_STATUS_LINK,
    );
  });
});
