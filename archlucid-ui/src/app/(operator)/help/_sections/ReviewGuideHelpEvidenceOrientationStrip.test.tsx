import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewGuideHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/ReviewGuideHelpEvidenceOrientationStrip";
import {
  REVIEW_GUIDE_HELP_CANONICAL_PATH,
  REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE,
  REVIEW_GUIDE_HELP_SOURCES,
  REVIEW_GUIDE_HELP_SOURCES_INTRO,
} from "@/lib/review-guide-help-evidence-copy";

describe("ReviewGuideHelpEvidenceOrientationStrip", () => {
  it("renders Sources and claim-discipline chrome", () => {
    render(<ReviewGuideHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("review-guide-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("review-guide-help-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(REVIEW_GUIDE_HELP_SOURCES_INTRO)).toBeInTheDocument();
    expect(screen.getByText(REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE)).toBeInTheDocument();

    for (const link of REVIEW_GUIDE_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(REVIEW_GUIDE_HELP_SOURCES.some((link) => link.href === REVIEW_GUIDE_HELP_CANONICAL_PATH)).toBe(false);
  });
});
