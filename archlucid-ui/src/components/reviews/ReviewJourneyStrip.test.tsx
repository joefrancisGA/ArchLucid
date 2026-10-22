import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  resolveReviewJourneyStep,
  ReviewJourneyStrip,
  ReviewObjectSentence,
} from "./ReviewJourneyStrip";

describe("ReviewJourneyStrip", () => {
  it("shows the five-step journey and the current unfinished step", () => {
    render(<ReviewJourneyStrip currentStep="decisions" isSealed={false} />);

    expect(screen.getByRole("region", { name: "Review progress" })).toBeInTheDocument();
    expect(screen.getByText("Evidence")).toBeInTheDocument();
    expect(screen.getByText("Analyze")).toBeInTheDocument();
    expect(screen.getByText("Findings")).toBeInTheDocument();
    expect(screen.getByText("Decisions")).toBeInTheDocument();
    expect(screen.getByText("Share")).toBeInTheDocument();
    expect(screen.getByText("Record decisions before you can finalize.")).toBeInTheDocument();
  });

  it("hides progress after seal and uses the matching object sentence", () => {
    render(
      <>
        <ReviewJourneyStrip currentStep="share" isSealed />
        <ReviewObjectSentence isSealed />
      </>,
    );

    expect(screen.queryByTestId("review-journey-strip")).not.toBeInTheDocument();
    expect(screen.getByTestId("review-object-sentence")).toHaveTextContent(
      "This review is sealed. The architecture package is locked.",
    );
  });

  it("maps workspace status to a useful current step", () => {
    expect(resolveReviewJourneyStep({ kind: "draft", label: "Draft" })).toBe("evidence");
    expect(resolveReviewJourneyStep({ kind: "analysis-in-progress", label: "Analysis in progress" })).toBe("analyze");
    expect(resolveReviewJourneyStep({ kind: "review-complete", label: "Review complete" })).toBe("findings");
    expect(resolveReviewJourneyStep({ kind: "awaiting-decision", label: "Awaiting decision" })).toBe("decisions");
    expect(resolveReviewJourneyStep({ kind: "finalized", label: "Finalized" })).toBe("share");
  });
});
