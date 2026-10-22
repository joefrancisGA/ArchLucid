import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WebhooksVsApiKeysReconciler } from "@/components/WebhooksVsApiKeysReconciler";
import {
  WEBHOOKS_VS_API_KEYS_API_KEYS_LINK,
  WEBHOOKS_VS_API_KEYS_COMPACT_LINE,
  WEBHOOKS_VS_API_KEYS_HEADING,
  WEBHOOKS_VS_API_KEYS_WEBHOOKS_LINK,
  WEBHOOKS_VS_API_KEYS_WHY_TWO,
} from "@/lib/webhooks-vs-api-keys";

describe("WebhooksVsApiKeysReconciler (TB-2242 / TB-2320)", () => {
  it("renders compact strip on webhooks with peer link to API keys", () => {
    render(<WebhooksVsApiKeysReconciler currentSurfaceId="webhooks" />);

    const strip = screen.getByTestId("webhooks-api-keys-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "webhooks");
    expect(strip.textContent ?? "").toContain(WEBHOOKS_VS_API_KEYS_COMPACT_LINE);

    const peer = screen.getByTestId("webhooks-api-keys-vocabulary-peer-link");
    expect(peer).toHaveTextContent(WEBHOOKS_VS_API_KEYS_API_KEYS_LINK.label);
    expect(peer).toHaveAttribute("href", WEBHOOKS_VS_API_KEYS_API_KEYS_LINK.href);
  });

  it("renders compact strip on API keys with peer link to webhooks", () => {
    render(<WebhooksVsApiKeysReconciler currentSurfaceId="api-keys" />);

    expect(screen.getByTestId("webhooks-api-keys-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "api-keys",
    );

    const peer = screen.getByTestId("webhooks-api-keys-vocabulary-peer-link");
    expect(peer).toHaveTextContent(WEBHOOKS_VS_API_KEYS_WEBHOOKS_LINK.label);
    expect(peer).toHaveAttribute("href", WEBHOOKS_VS_API_KEYS_WEBHOOKS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(<WebhooksVsApiKeysReconciler currentSurfaceId="webhooks" variant="full" />);

    const strip = screen.getByTestId("webhooks-api-keys-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(WEBHOOKS_VS_API_KEYS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(WEBHOOKS_VS_API_KEYS_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("webhooks-api-keys-vocabulary-current")).toHaveTextContent(
      WEBHOOKS_VS_API_KEYS_WEBHOOKS_LINK.label,
    );
  });
});
