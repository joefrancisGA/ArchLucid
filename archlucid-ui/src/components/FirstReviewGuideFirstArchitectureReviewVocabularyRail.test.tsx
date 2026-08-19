import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FirstReviewGuideFirstArchitectureReviewVocabularyRail } from "@/components/FirstReviewGuideFirstArchitectureReviewVocabularyRail";
import {
  FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_COMPACT_LINE,
  FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_GUIDE_LINK,
  FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_HEADING,
  FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_HELP_LINK,
  FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_WHY_TWO,
} from "@/lib/vocabulary/first-review-guide-first-architecture-review-vocabulary";

describe("FirstReviewGuideFirstArchitectureReviewVocabularyRail (TB-2323)", () => {
  it("renders first-review-guide strip with peer link to first architecture review help", () => {
    render(
      <FirstReviewGuideFirstArchitectureReviewVocabularyRail currentSurfaceId="first-review-guide" />,
    );

    const strip = screen.getByTestId("first-review-guide-first-architecture-review-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "first-review-guide");
    expect(strip.textContent ?? "").toContain(FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_COMPACT_LINE);

    const peer = screen.getByTestId(
      "first-review-guide-first-architecture-review-vocabulary-peer-link",
    );
    expect(peer).toHaveTextContent(FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_HELP_LINK.label);
    expect(peer).toHaveAttribute("href", FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_HELP_LINK.href);
  });

  it("renders first-architecture-review strip with peer link to First review guide", () => {
    render(
      <FirstReviewGuideFirstArchitectureReviewVocabularyRail currentSurfaceId="first-architecture-review" />,
    );

    const peer = screen.getByTestId(
      "first-review-guide-first-architecture-review-vocabulary-peer-link",
    );
    expect(peer).toHaveTextContent(FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_GUIDE_LINK.label);
    expect(peer).toHaveAttribute("href", FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_GUIDE_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <FirstReviewGuideFirstArchitectureReviewVocabularyRail
        currentSurfaceId="first-review-guide"
        variant="full"
      />,
    );

    expect(screen.getByText(FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_HEADING)).toBeInTheDocument();
    expect(screen.getByText(FIRST_REVIEW_GUIDE_FIRST_ARCHITECTURE_REVIEW_WHY_TWO)).toBeInTheDocument();
  });
});
