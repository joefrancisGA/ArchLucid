import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScorecardRoiVocabularyRail } from "@/components/ScorecardRoiVocabularyRail";
import {
  SCORECARD_ROI_COMPACT_LINE,
  SCORECARD_ROI_HEADING,
  SCORECARD_ROI_ROI_SUMMARY_LINK,
  SCORECARD_ROI_SCORECARD_LINK,
  SCORECARD_ROI_WHY_TWO,
} from "@/lib/vocabulary/scorecard-roi-vocabulary";

describe("ScorecardRoiVocabularyRail (TB-2265)", () => {
  it("renders scorecard strip with peer link to roi summary", () => {
    render(<ScorecardRoiVocabularyRail currentSurfaceId="scorecard" />);

    const strip = screen.getByTestId("scorecard-roi-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "scorecard");
    expect(strip.textContent ?? "").toContain(SCORECARD_ROI_COMPACT_LINE);

    const peer = screen.getByTestId("scorecard-roi-vocabulary-peer-link");
    expect(peer).toHaveTextContent(SCORECARD_ROI_ROI_SUMMARY_LINK.label);
    expect(peer).toHaveAttribute("href", SCORECARD_ROI_ROI_SUMMARY_LINK.href);
  });

  it("renders roi-summary strip with peer link to scorecard", () => {
    render(<ScorecardRoiVocabularyRail currentSurfaceId="roi-summary" />);

    expect(screen.getByTestId("scorecard-roi-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "roi-summary",
    );

    const peer = screen.getByTestId("scorecard-roi-vocabulary-peer-link");
    expect(peer).toHaveTextContent(SCORECARD_ROI_SCORECARD_LINK.label);
    expect(peer).toHaveAttribute("href", SCORECARD_ROI_SCORECARD_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(<ScorecardRoiVocabularyRail currentSurfaceId="scorecard" variant="full" />);

    const strip = screen.getByTestId("scorecard-roi-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(SCORECARD_ROI_HEADING)).toBeInTheDocument();
    expect(screen.getByText(SCORECARD_ROI_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("scorecard-roi-vocabulary-current")).toHaveTextContent(
      SCORECARD_ROI_SCORECARD_LINK.label,
    );
  });
});
