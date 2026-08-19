import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArtifactPreviewSponsorExportVocabularyRail } from "@/components/ArtifactPreviewSponsorExportVocabularyRail";
import {
  ARTIFACT_PREVIEW_SPONSOR_EXPORT_COMPACT_LINE,
  ARTIFACT_PREVIEW_SPONSOR_EXPORT_HEADING,
  ARTIFACT_PREVIEW_SPONSOR_EXPORT_RECORDS_PEER_LINK,
  ARTIFACT_PREVIEW_SPONSOR_EXPORT_SPONSOR_LINK,
  ARTIFACT_PREVIEW_SPONSOR_EXPORT_WHY_TWO,
  buildArtifactPreviewSponsorExportVocabulary,
} from "@/lib/vocabulary/artifact-preview-sponsor-export-vocabulary";

describe("ArtifactPreviewSponsorExportVocabularyRail (TB-2303)", () => {
  it("renders artifact-preview strip with peer link to sponsor export", () => {
    const model = buildArtifactPreviewSponsorExportVocabulary({
      artifactHref: "/governance/sealed-records/m1/artifacts/a1",
      runId: "run-abc",
    });

    render(
      <ArtifactPreviewSponsorExportVocabularyRail
        currentSurfaceId="artifact-preview"
        artifactHref="/governance/sealed-records/m1/artifacts/a1"
        runId="run-abc"
      />,
    );

    const strip = screen.getByTestId("artifact-preview-sponsor-export-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "artifact-preview");
    expect(strip.textContent ?? "").toContain(ARTIFACT_PREVIEW_SPONSOR_EXPORT_COMPACT_LINE);

    const peer = screen.getByTestId("artifact-preview-sponsor-export-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ARTIFACT_PREVIEW_SPONSOR_EXPORT_SPONSOR_LINK.label);
    expect(peer).toHaveAttribute("href", model.sponsorExportLink.href);
  });

  it("renders sponsor-export strip with Sealed review records peer", () => {
    render(
      <ArtifactPreviewSponsorExportVocabularyRail currentSurfaceId="sponsor-export" />,
    );

    const peer = screen.getByTestId("artifact-preview-sponsor-export-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ARTIFACT_PREVIEW_SPONSOR_EXPORT_RECORDS_PEER_LINK.label);
    expect(peer).toHaveAttribute("href", ARTIFACT_PREVIEW_SPONSOR_EXPORT_RECORDS_PEER_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <ArtifactPreviewSponsorExportVocabularyRail
        currentSurfaceId="artifact-preview"
        variant="full"
      />,
    );

    expect(screen.getByText(ARTIFACT_PREVIEW_SPONSOR_EXPORT_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ARTIFACT_PREVIEW_SPONSOR_EXPORT_WHY_TWO)).toBeInTheDocument();
  });
});
