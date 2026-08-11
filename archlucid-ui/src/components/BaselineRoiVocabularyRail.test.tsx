import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BaselineRoiVocabularyRail } from "@/components/BaselineRoiVocabularyRail";
import {
  BASELINE_ROI_BASELINE_LINK,
  BASELINE_ROI_COMPACT_LINE,
  BASELINE_ROI_HEADING,
  BASELINE_ROI_ROI_SUMMARY_LINK,
  BASELINE_ROI_WHY_TWO,
} from "@/lib/baseline-roi-vocabulary";

describe("BaselineRoiVocabularyRail (TB-2275)", () => {
  it("renders baseline strip with peer link to roi summary", () => {
    render(<BaselineRoiVocabularyRail currentSurfaceId="baseline" />);

    const strip = screen.getByTestId("baseline-roi-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "baseline");
    expect(strip.textContent ?? "").toContain(BASELINE_ROI_COMPACT_LINE);

    const peer = screen.getByTestId("baseline-roi-vocabulary-peer-link");
    expect(peer).toHaveTextContent(BASELINE_ROI_ROI_SUMMARY_LINK.label);
    expect(peer).toHaveAttribute("href", BASELINE_ROI_ROI_SUMMARY_LINK.href);
  });

  it("renders roi-summary strip with peer link to baseline", () => {
    render(<BaselineRoiVocabularyRail currentSurfaceId="roi-summary" />);

    expect(screen.getByTestId("baseline-roi-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "roi-summary",
    );

    const peer = screen.getByTestId("baseline-roi-vocabulary-peer-link");
    expect(peer).toHaveTextContent(BASELINE_ROI_BASELINE_LINK.label);
    expect(peer).toHaveAttribute("href", BASELINE_ROI_BASELINE_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(<BaselineRoiVocabularyRail currentSurfaceId="baseline" variant="full" />);

    const strip = screen.getByTestId("baseline-roi-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(BASELINE_ROI_HEADING)).toBeInTheDocument();
    expect(screen.getByText(BASELINE_ROI_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("baseline-roi-vocabulary-current")).toHaveTextContent(
      BASELINE_ROI_BASELINE_LINK.label,
    );
  });
});
