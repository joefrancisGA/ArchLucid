import { describe, expect, it } from "vitest";

import {
  WEBHOOKS_VS_DLQ_COMPACT_LINE,
  WEBHOOKS_VS_DLQ_DLQ_LINK,
  WEBHOOKS_VS_DLQ_HEADING,
  WEBHOOKS_VS_DLQ_WEBHOOKS_LINK,
  WEBHOOKS_VS_DLQ_WHY_TWO,
  buildWebhooksVsDlqVocabulary,
  resolveWebhooksVsDlqPeerLink,
} from "@/lib/webhooks-vs-dlq-vocabulary";
import { INTEGRATIONS_WEBHOOKS_PATH } from "@/lib/integrations-nav-paths";
import { INTERNAL_INTEGRATION_EVENTS_DLQ_PATH } from "@/lib/internal-ops-route-paths";

describe("webhooks-vs-dlq-vocabulary (TB-2264)", () => {
  it("explains webhooks outbound delivery vs DLQ ops recovery", () => {
    const model = buildWebhooksVsDlqVocabulary();

    expect(model.heading).toBe(WEBHOOKS_VS_DLQ_HEADING);
    expect(model.heading.toLowerCase()).toContain("webhook");
    expect(model.heading.toLowerCase()).toContain("dead letter");
    expect(model.whyTwo).toBe(WEBHOOKS_VS_DLQ_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("outbound delivery");
    expect(model.whyTwo.toLowerCase()).toContain("ops recovery");
    expect(model.compactLine).toBe(WEBHOOKS_VS_DLQ_COMPACT_LINE);

    expect(model.webhooksLink).toEqual(WEBHOOKS_VS_DLQ_WEBHOOKS_LINK);
    expect(model.webhooksLink.href).toBe(INTEGRATIONS_WEBHOOKS_PATH);
    expect(model.webhooksLink.href).toBe("/integrations/webhooks");

    expect(model.dlqLink).toEqual(WEBHOOKS_VS_DLQ_DLQ_LINK);
    expect(model.dlqLink.href).toBe(INTERNAL_INTEGRATION_EVENTS_DLQ_PATH);
    expect(model.dlqLink.href).toBe("/internal/integration-events/dlq");
  });

  it("resolves the peer surface from webhooks and dlq", () => {
    expect(resolveWebhooksVsDlqPeerLink("webhooks")).toEqual(WEBHOOKS_VS_DLQ_DLQ_LINK);
    expect(resolveWebhooksVsDlqPeerLink("dlq")).toEqual(WEBHOOKS_VS_DLQ_WEBHOOKS_LINK);
  });
});
