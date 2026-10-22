import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewsHubInFlightAnalysisDesk } from "./ReviewsHubInFlightAnalysisDesk";

describe("ReviewsHubInFlightAnalysisDesk (LD-11)", () => {
  it("returns null when there are no in-flight rows", () => {
    const view = render(<ReviewsHubInFlightAnalysisDesk rows={[]} />);

    expect(view.container).toBeEmptyDOMElement();
  });

  it("renders in-flight desk rows with Activity deep links", () => {
    render(
      <ReviewsHubInFlightAnalysisDesk
        rows={[
          {
            operationId: "run:abc",
            title: "Claims intake review",
            stepLabel: "Agents running",
            state: "Running",
            href: "/architecture/reviews/abc?reviewTab=activity",
            statusLabel: "Agents running",
            detailLine: "Analysis is running. Continue on Activity for named stages — not ready to seal yet.",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("reviews-hub-in-flight-analysis")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-in-flight-open-run:abc")).toHaveAttribute(
      "href",
      "/architecture/reviews/abc?reviewTab=activity",
    );
    expect(screen.getByText("Agents running")).toBeInTheDocument();
  });
});
