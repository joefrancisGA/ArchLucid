import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImpactPreviewCompareVocabularyRail } from "@/components/ImpactPreviewCompareVocabularyRail";
import {
  IMPACT_PREVIEW_COMPARE_COMPARE_LINK,
  IMPACT_PREVIEW_COMPARE_COMPACT_LINE,
  IMPACT_PREVIEW_COMPARE_HEADING,
  IMPACT_PREVIEW_COMPARE_IMPACT_PREVIEW_LINK,
  IMPACT_PREVIEW_COMPARE_WHY_TWO,
} from "@/lib/impact-preview-compare-vocabulary";

describe("ImpactPreviewCompareVocabularyRail (TB-2250)", () => {
  it("renders compact strip on impact preview with peer link to compare", () => {
    render(
      <ImpactPreviewCompareVocabularyRail currentSurfaceId="impact-preview" />,
    );

    const strip = screen.getByTestId("impact-preview-compare-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "impact-preview");
    expect(strip.textContent ?? "").toContain(IMPACT_PREVIEW_COMPARE_COMPACT_LINE);

    const peer = screen.getByTestId("impact-preview-compare-vocabulary-peer-link");
    expect(peer).toHaveTextContent(IMPACT_PREVIEW_COMPARE_COMPARE_LINK.label);
    expect(peer).toHaveAttribute("href", IMPACT_PREVIEW_COMPARE_COMPARE_LINK.href);
  });

  it("renders compact strip on compare with peer link to impact preview", () => {
    render(<ImpactPreviewCompareVocabularyRail currentSurfaceId="compare" />);

    expect(screen.getByTestId("impact-preview-compare-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "compare",
    );

    const peer = screen.getByTestId("impact-preview-compare-vocabulary-peer-link");
    expect(peer).toHaveTextContent(IMPACT_PREVIEW_COMPARE_IMPACT_PREVIEW_LINK.label);
    expect(peer).toHaveAttribute("href", IMPACT_PREVIEW_COMPARE_IMPACT_PREVIEW_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <ImpactPreviewCompareVocabularyRail
        currentSurfaceId="impact-preview"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("impact-preview-compare-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(IMPACT_PREVIEW_COMPARE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(IMPACT_PREVIEW_COMPARE_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-compare-vocabulary-current")).toHaveTextContent(
      IMPACT_PREVIEW_COMPARE_IMPACT_PREVIEW_LINK.label,
    );
  });
});
