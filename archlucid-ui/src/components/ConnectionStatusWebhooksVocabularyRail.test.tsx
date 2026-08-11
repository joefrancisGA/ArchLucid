import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConnectionStatusWebhooksVocabularyRail } from "@/components/ConnectionStatusWebhooksVocabularyRail";
import {
  CONNECTION_STATUS_WEBHOOKS_COMPACT_LINE,
  CONNECTION_STATUS_WEBHOOKS_HEADING,
  CONNECTION_STATUS_WEBHOOKS_STATUS_LINK,
  CONNECTION_STATUS_WEBHOOKS_WEBHOOKS_LINK,
  CONNECTION_STATUS_WEBHOOKS_WHY_TWO,
} from "@/lib/vocabulary/connection-status-webhooks-vocabulary";

describe("ConnectionStatusWebhooksVocabularyRail (TB-2301)", () => {
  it("renders connection-status strip with peer link to webhooks", () => {
    render(<ConnectionStatusWebhooksVocabularyRail currentSurfaceId="connection-status" />);

    const strip = screen.getByTestId("connection-status-webhooks-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "connection-status");
    expect(strip.textContent ?? "").toContain(CONNECTION_STATUS_WEBHOOKS_COMPACT_LINE);

    const peer = screen.getByTestId("connection-status-webhooks-vocabulary-peer-link");
    expect(peer).toHaveTextContent(CONNECTION_STATUS_WEBHOOKS_WEBHOOKS_LINK.label);
    expect(peer).toHaveAttribute("href", CONNECTION_STATUS_WEBHOOKS_WEBHOOKS_LINK.href);
  });

  it("renders webhooks strip with peer link to connection status", () => {
    render(<ConnectionStatusWebhooksVocabularyRail currentSurfaceId="webhooks" />);

    const peer = screen.getByTestId("connection-status-webhooks-vocabulary-peer-link");
    expect(peer).toHaveTextContent(CONNECTION_STATUS_WEBHOOKS_STATUS_LINK.label);
    expect(peer).toHaveAttribute("href", CONNECTION_STATUS_WEBHOOKS_STATUS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <ConnectionStatusWebhooksVocabularyRail
        currentSurfaceId="connection-status"
        variant="full"
      />,
    );

    expect(screen.getByText(CONNECTION_STATUS_WEBHOOKS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(CONNECTION_STATUS_WEBHOOKS_WHY_TWO)).toBeInTheDocument();
  });
});
