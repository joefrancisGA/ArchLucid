import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PilotGuideGettingStartedFirstReviewVocabularyRail } from "@/components/PilotGuideGettingStartedFirstReviewVocabularyRail";
import {
  PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_COMPACT_LINE,
  PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_FIRST_REVIEW_LINK,
  PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_GETTING_STARTED_LINK,
  PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_HEADING,
  PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_PILOT_GUIDE_LINK,
  PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_WHY_THREE,
} from "@/lib/vocabulary/pilot-guide-getting-started-first-review-vocabulary";

describe("PilotGuideGettingStartedFirstReviewVocabularyRail (TB-2322)", () => {
  it("renders pilot-guide strip with peers to getting started and first review", () => {
    render(<PilotGuideGettingStartedFirstReviewVocabularyRail currentSurfaceId="pilot-guide" />);

    const strip = screen.getByTestId("pilot-guide-getting-started-first-review-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "pilot-guide");
    expect(strip.textContent ?? "").toContain(PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_COMPACT_LINE);

    const gettingStarted = screen.getByTestId(
      "pilot-guide-getting-started-first-review-vocabulary-peer-getting-started",
    );
    expect(gettingStarted).toHaveTextContent(
      PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_GETTING_STARTED_LINK.label,
    );
    expect(gettingStarted).toHaveAttribute(
      "href",
      PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_GETTING_STARTED_LINK.href,
    );

    const firstReview = screen.getByTestId(
      "pilot-guide-getting-started-first-review-vocabulary-peer-first-architecture-review",
    );
    expect(firstReview).toHaveTextContent(
      PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_FIRST_REVIEW_LINK.label,
    );
  });

  it("renders full variant with why-three explanation", () => {
    render(
      <PilotGuideGettingStartedFirstReviewVocabularyRail
        currentSurfaceId="getting-started"
        variant="full"
      />,
    );

    expect(screen.getByText(PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_HEADING)).toBeInTheDocument();
    expect(screen.getByText(PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_WHY_THREE)).toBeInTheDocument();
    expect(
      screen.getByTestId("pilot-guide-getting-started-first-review-vocabulary-current"),
    ).toHaveTextContent(PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_GETTING_STARTED_LINK.label);
    expect(
      screen.getByTestId("pilot-guide-getting-started-first-review-vocabulary-peer-pilot-guide"),
    ).toHaveAttribute("href", PILOT_GUIDE_GETTING_STARTED_FIRST_REVIEW_PILOT_GUIDE_LINK.href);
  });
});
