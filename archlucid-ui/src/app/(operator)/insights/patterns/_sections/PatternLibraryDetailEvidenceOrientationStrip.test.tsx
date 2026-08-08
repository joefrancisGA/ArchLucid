import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatternLibraryDetailEvidenceOrientationStrip } from "@/app/(operator)/insights/patterns/_sections/PatternLibraryDetailEvidenceOrientationStrip";
import {
  PATTERN_LIBRARY_DETAIL_SOURCES,
  PATTERN_LIBRARY_DETAIL_WORKBOOK_PATH,
} from "@/lib/pattern-library-detail-evidence-copy";

describe("PatternLibraryDetailEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the detail workbook path", () => {
    render(<PatternLibraryDetailEvidenceOrientationStrip />);

    expect(screen.getByTestId("pattern-library-detail-sources")).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-detail-claim-discipline")).toHaveTextContent(
      /Anonymized|diligence Sources|CPA SOC 2/i,
    );

    const sources = screen.getByTestId("pattern-library-detail-sources");

    for (const link of PATTERN_LIBRARY_DETAIL_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      PATTERN_LIBRARY_DETAIL_SOURCES.some((link) => link.href === PATTERN_LIBRARY_DETAIL_WORKBOOK_PATH),
    ).toBe(false);
  });
});
