import { describe, expect, it } from "vitest";

import { formatWebhookDestinationLabel } from "@/lib/webhooks-destination-present";

describe("formatWebhookDestinationLabel", () => {
  it("masks path and query segments", () => {
    expect(formatWebhookDestinationLabel("https://hooks.example.com/secret/path?token=abc")).toBe("hooks.example.com/…");
  });

  it("shows hostname only for root paths", () => {
    expect(formatWebhookDestinationLabel("https://listener.example/")).toBe("listener.example");
  });
});
