import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExtractUploadCloudConnectionsVocabularyRail } from "@/components/ExtractUploadCloudConnectionsVocabularyRail";
import {
  EXTRACT_UPLOAD_CLOUD_CONNECTIONS_CLOUD_LINK,
  EXTRACT_UPLOAD_CLOUD_CONNECTIONS_COMPACT_LINE,
  EXTRACT_UPLOAD_CLOUD_CONNECTIONS_EXTRACT_LINK,
  EXTRACT_UPLOAD_CLOUD_CONNECTIONS_HEADING,
  EXTRACT_UPLOAD_CLOUD_CONNECTIONS_WHY_TWO,
} from "@/lib/extract-upload-cloud-connections-vocabulary";

describe("ExtractUploadCloudConnectionsVocabularyRail (TB-2281)", () => {
  it("renders extract-upload strip with peer link to cloud connections", () => {
    render(
      <ExtractUploadCloudConnectionsVocabularyRail currentSurfaceId="extract-upload" />,
    );

    const strip = screen.getByTestId("extract-upload-cloud-connections-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "extract-upload");
    expect(strip.textContent ?? "").toContain(EXTRACT_UPLOAD_CLOUD_CONNECTIONS_COMPACT_LINE);

    const peer = screen.getByTestId("extract-upload-cloud-connections-vocabulary-peer-link");
    expect(peer).toHaveTextContent(EXTRACT_UPLOAD_CLOUD_CONNECTIONS_CLOUD_LINK.label);
    expect(peer).toHaveAttribute("href", EXTRACT_UPLOAD_CLOUD_CONNECTIONS_CLOUD_LINK.href);
  });

  it("renders cloud connections strip with peer link to extract-upload", () => {
    render(
      <ExtractUploadCloudConnectionsVocabularyRail currentSurfaceId="cloud-connections" />,
    );

    expect(screen.getByTestId("extract-upload-cloud-connections-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "cloud-connections",
    );

    const peer = screen.getByTestId("extract-upload-cloud-connections-vocabulary-peer-link");
    expect(peer).toHaveTextContent(EXTRACT_UPLOAD_CLOUD_CONNECTIONS_EXTRACT_LINK.label);
    expect(peer).toHaveAttribute("href", EXTRACT_UPLOAD_CLOUD_CONNECTIONS_EXTRACT_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <ExtractUploadCloudConnectionsVocabularyRail
        currentSurfaceId="extract-upload"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("extract-upload-cloud-connections-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(EXTRACT_UPLOAD_CLOUD_CONNECTIONS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(EXTRACT_UPLOAD_CLOUD_CONNECTIONS_WHY_TWO)).toBeInTheDocument();
    expect(
      screen.getByTestId("extract-upload-cloud-connections-vocabulary-current"),
    ).toHaveTextContent(EXTRACT_UPLOAD_CLOUD_CONNECTIONS_EXTRACT_LINK.label);
  });
});
