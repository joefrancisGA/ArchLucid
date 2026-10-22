import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GettingStartedFirstArchitectureReviewVocabularyRail } from "@/components/GettingStartedFirstArchitectureReviewVocabularyRail";
import {
  GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_COMPACT_LINE,
  GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_FIRST_REVIEW_LINK,
  GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_GETTING_STARTED_LINK,
  GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_HEADING,
  GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_WHY_TWO,
} from "@/lib/vocabulary/getting-started-first-architecture-review-vocabulary";

describe("GettingStartedFirstArchitectureReviewVocabularyRail (TB-2312)", () => {
  it("renders getting-started strip with peer link to first architecture review", () => {
    render(
      <GettingStartedFirstArchitectureReviewVocabularyRail currentSurfaceId="getting-started" />,
    );

    const strip = screen.getByTestId("getting-started-first-architecture-review-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "getting-started");
    expect(strip.textContent ?? "").toContain(GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_COMPACT_LINE);

    const peer = screen.getByTestId("getting-started-first-architecture-review-vocabulary-peer-link");
    expect(peer).toHaveTextContent(GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_FIRST_REVIEW_LINK.label);
    expect(peer).toHaveAttribute("href", GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_FIRST_REVIEW_LINK.href);
  });

  it("renders first-architecture-review strip with peer link to getting started", () => {
    render(
      <GettingStartedFirstArchitectureReviewVocabularyRail currentSurfaceId="first-architecture-review" />,
    );

    const peer = screen.getByTestId("getting-started-first-architecture-review-vocabulary-peer-link");
    expect(peer).toHaveTextContent(
      GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_GETTING_STARTED_LINK.label,
    );
    expect(peer).toHaveAttribute(
      "href",
      GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_GETTING_STARTED_LINK.href,
    );
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <GettingStartedFirstArchitectureReviewVocabularyRail
        currentSurfaceId="getting-started"
        variant="full"
      />,
    );

    expect(screen.getByText(GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_HEADING)).toBeInTheDocument();
    expect(screen.getByText(GETTING_STARTED_FIRST_ARCHITECTURE_REVIEW_WHY_TWO)).toBeInTheDocument();
  });
});
