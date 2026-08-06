import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FirstReviewGuideEvidenceOrientationStrip } from "@/app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuideEvidenceOrientationStrip";
import {
  FIRST_REVIEW_GUIDE_CANONICAL_PATH,
  FIRST_REVIEW_GUIDE_SOURCES,
} from "@/lib/first-review-guide-evidence-copy";

describe("FirstReviewGuideEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking First review guide", () => {
    render(<FirstReviewGuideEvidenceOrientationStrip />);

    expect(screen.getByTestId("first-review-guide-sources")).toBeInTheDocument();
    expect(screen.getByTestId("first-review-guide-claim-discipline")).toBeInTheDocument();

    for (const link of FIRST_REVIEW_GUIDE_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      FIRST_REVIEW_GUIDE_SOURCES.some((link) => link.href === FIRST_REVIEW_GUIDE_CANONICAL_PATH),
    ).toBe(false);
  });
});
