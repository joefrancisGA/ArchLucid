import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoiSummaryEvidenceOrientationStrip } from "@/app/(operator)/insights/roi-summary/_sections/RoiSummaryEvidenceOrientationStrip";
import {
  ROI_SUMMARY_CANONICAL_PATH,
  ROI_SUMMARY_SOURCES,
} from "@/lib/roi-summary-evidence-copy";

describe("RoiSummaryEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking ROI summary", () => {
    render(<RoiSummaryEvidenceOrientationStrip />);

    expect(screen.getByTestId("roi-summary-sources")).toBeInTheDocument();
    expect(screen.getByTestId("roi-summary-claim-discipline")).toBeInTheDocument();

    for (const link of ROI_SUMMARY_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(ROI_SUMMARY_SOURCES.some((link) => link.href === ROI_SUMMARY_CANONICAL_PATH)).toBe(false);
  });
});