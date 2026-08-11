import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoiSponsorExportVocabularyRail } from "@/components/RoiSponsorExportVocabularyRail";
import {
  ROI_SPONSOR_EXPORT_COMPACT_LINE,
  ROI_SPONSOR_EXPORT_HEADING,
  ROI_SPONSOR_EXPORT_ROI_SUMMARY_LINK,
  ROI_SPONSOR_EXPORT_SPONSOR_HANDOFF_LINK,
  ROI_SPONSOR_EXPORT_WHY_TWO,
} from "@/lib/roi-sponsor-export-vocabulary";

describe("RoiSponsorExportVocabularyRail (TB-2258)", () => {
  it("from ROI summary links sponsor export", () => {
    render(<RoiSponsorExportVocabularyRail currentSurfaceId="roi-summary" />);

    const strip = screen.getByTestId("roi-sponsor-export-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "roi-summary");
    expect(strip.textContent ?? "").toContain(ROI_SPONSOR_EXPORT_COMPACT_LINE);

    const peer = screen.getByTestId("roi-sponsor-export-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ROI_SPONSOR_EXPORT_SPONSOR_HANDOFF_LINK.label);
    expect(peer).toHaveAttribute("href", ROI_SPONSOR_EXPORT_SPONSOR_HANDOFF_LINK.href);
  });

  it("from sponsor handoff links ROI summary and scopes run href when provided", () => {
    render(
      <RoiSponsorExportVocabularyRail currentSurfaceId="sponsor-handoff" runId="run-abc" />,
    );

    const peer = screen.getByTestId("roi-sponsor-export-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ROI_SPONSOR_EXPORT_ROI_SUMMARY_LINK.label);
    expect(peer).toHaveAttribute("href", ROI_SPONSOR_EXPORT_ROI_SUMMARY_LINK.href);
  });

  it("from ROI summary with runId scopes the sponsor-export peer to review handoff", () => {
    render(
      <RoiSponsorExportVocabularyRail currentSurfaceId="roi-summary" runId="run-abc" />,
    );

    const peer = screen.getByTestId("roi-sponsor-export-vocabulary-peer-link");
    expect(peer).toHaveAttribute("href", "/architecture/reviews/run-abc#sponsor-handoff");
  });

  it("from executive dashboard links ROI summary", () => {
    render(<RoiSponsorExportVocabularyRail currentSurfaceId="executive-dashboard" />);

    const peer = screen.getByTestId("roi-sponsor-export-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ROI_SPONSOR_EXPORT_ROI_SUMMARY_LINK.label);
    expect(peer).toHaveAttribute("href", ROI_SPONSOR_EXPORT_ROI_SUMMARY_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(<RoiSponsorExportVocabularyRail currentSurfaceId="roi-summary" variant="full" />);

    const strip = screen.getByTestId("roi-sponsor-export-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(ROI_SPONSOR_EXPORT_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ROI_SPONSOR_EXPORT_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("roi-sponsor-export-vocabulary-current")).toHaveTextContent(
      ROI_SPONSOR_EXPORT_ROI_SUMMARY_LINK.label,
    );
  });
});
