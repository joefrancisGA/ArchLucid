import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WebhooksApiKeysVocabularyRail } from "@/components/WebhooksApiKeysVocabularyRail";
import {
  WEBHOOKS_API_KEYS_API_KEYS_LINK,
  WEBHOOKS_API_KEYS_COMPACT_LINE,
  WEBHOOKS_API_KEYS_HEADING,
  WEBHOOKS_API_KEYS_WEBHOOKS_LINK,
  WEBHOOKS_API_KEYS_WHY_TWO,
} from "@/lib/vocabulary/webhooks-api-keys-vocabulary";

describe("WebhooksApiKeysVocabularyRail (TB-2320)", () => {
  it("renders webhooks strip with peer link to API keys", () => {
    render(<WebhooksApiKeysVocabularyRail currentSurfaceId="webhooks" />);

    const strip = screen.getByTestId("webhooks-api-keys-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "webhooks");
    expect(strip.textContent ?? "").toContain(WEBHOOKS_API_KEYS_COMPACT_LINE);

    const peer = screen.getByTestId("webhooks-api-keys-vocabulary-peer-link");
    expect(peer).toHaveTextContent(WEBHOOKS_API_KEYS_API_KEYS_LINK.label);
    expect(peer).toHaveAttribute("href", WEBHOOKS_API_KEYS_API_KEYS_LINK.href);
  });

  it("renders api-keys strip with peer link to webhooks", () => {
    render(<WebhooksApiKeysVocabularyRail currentSurfaceId="api-keys" />);

    expect(screen.getByTestId("webhooks-api-keys-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "api-keys",
    );

    const peer = screen.getByTestId("webhooks-api-keys-vocabulary-peer-link");
    expect(peer).toHaveTextContent(WEBHOOKS_API_KEYS_WEBHOOKS_LINK.label);
    expect(peer).toHaveAttribute("href", WEBHOOKS_API_KEYS_WEBHOOKS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(<WebhooksApiKeysVocabularyRail currentSurfaceId="webhooks" variant="full" />);

    const strip = screen.getByTestId("webhooks-api-keys-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(WEBHOOKS_API_KEYS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(WEBHOOKS_API_KEYS_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("webhooks-api-keys-vocabulary-current")).toHaveTextContent(
      WEBHOOKS_API_KEYS_WEBHOOKS_LINK.label,
    );
  });
});
