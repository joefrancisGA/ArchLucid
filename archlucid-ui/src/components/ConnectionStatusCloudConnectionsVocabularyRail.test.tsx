import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConnectionStatusCloudConnectionsVocabularyRail } from "@/components/ConnectionStatusCloudConnectionsVocabularyRail";
import {
  CONNECTION_STATUS_CLOUD_CONNECTIONS_CLOUD_LINK,
  CONNECTION_STATUS_CLOUD_CONNECTIONS_COMPACT_LINE,
  CONNECTION_STATUS_CLOUD_CONNECTIONS_HEADING,
  CONNECTION_STATUS_CLOUD_CONNECTIONS_STATUS_LINK,
  CONNECTION_STATUS_CLOUD_CONNECTIONS_WHY_TWO,
} from "@/lib/vocabulary/connection-status-cloud-connections-vocabulary";

describe("ConnectionStatusCloudConnectionsVocabularyRail (TB-2245)", () => {
  it("renders compact strip on connection status with peer link to cloud connections", () => {
    render(
      <ConnectionStatusCloudConnectionsVocabularyRail currentSurfaceId="connection-status" />,
    );

    const strip = screen.getByTestId("connection-status-cloud-connections-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "connection-status");
    expect(strip.textContent ?? "").toContain(CONNECTION_STATUS_CLOUD_CONNECTIONS_COMPACT_LINE);

    const peer = screen.getByTestId("connection-status-cloud-connections-vocabulary-peer-link");
    expect(peer).toHaveTextContent(CONNECTION_STATUS_CLOUD_CONNECTIONS_CLOUD_LINK.label);
    expect(peer).toHaveAttribute("href", CONNECTION_STATUS_CLOUD_CONNECTIONS_CLOUD_LINK.href);
  });

  it("renders compact strip on cloud connections with peer link to connection status", () => {
    render(
      <ConnectionStatusCloudConnectionsVocabularyRail currentSurfaceId="cloud-connections" />,
    );

    expect(screen.getByTestId("connection-status-cloud-connections-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "cloud-connections",
    );

    const peer = screen.getByTestId("connection-status-cloud-connections-vocabulary-peer-link");
    expect(peer).toHaveTextContent(CONNECTION_STATUS_CLOUD_CONNECTIONS_STATUS_LINK.label);
    expect(peer).toHaveAttribute("href", CONNECTION_STATUS_CLOUD_CONNECTIONS_STATUS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <ConnectionStatusCloudConnectionsVocabularyRail
        currentSurfaceId="connection-status"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("connection-status-cloud-connections-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(CONNECTION_STATUS_CLOUD_CONNECTIONS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(CONNECTION_STATUS_CLOUD_CONNECTIONS_WHY_TWO)).toBeInTheDocument();
    expect(
      screen.getByTestId("connection-status-cloud-connections-vocabulary-current"),
    ).toHaveTextContent(CONNECTION_STATUS_CLOUD_CONNECTIONS_STATUS_LINK.label);
  });
});
