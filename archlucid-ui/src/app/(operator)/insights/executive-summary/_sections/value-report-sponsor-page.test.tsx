import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PilotOutcomesEmptyState } from "./PilotOutcomesEmptyState";
import { ValueReportIncludesSection } from "./ValueReportIncludesSection";

describe("PilotOutcomesEmptyState", () => {
  it("uses report-contextual CTAs instead of create-architecture primary", () => {
    render(
      <PilotOutcomesEmptyState
        diagnostics={{
          reportingPeriodLabel: "Last 30 days",
          reviewsFinalized: 0,
          reviewsInTimeline: 0,
          mostRecentFinalizedUtc: null,
          mostRecentFinalizedRunId: null,
          includesSampleData: false,
          hasQualifyingData: false,
        }}
        onApplyPeriod={vi.fn()}
        periodBusy={false}
      />,
    );

    expect(screen.getByText("No finalized reviews in this reporting period")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View completed reviews" })).toHaveAttribute(
      "href",
      "/architecture/reviews?status=completed",
    );
    expect(screen.getByRole("link", { name: "Start an architecture review" })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(screen.queryByRole("link", { name: "Create architecture" })).not.toBeInTheDocument();
  });

  it("calls onApplyPeriod when Adjust reporting period is clicked", () => {
    const onApplyPeriod = vi.fn();

    render(
      <PilotOutcomesEmptyState
        diagnostics={{
          reportingPeriodLabel: "Last 30 days",
          reviewsFinalized: 0,
          reviewsInTimeline: 0,
          mostRecentFinalizedUtc: null,
          mostRecentFinalizedRunId: null,
          includesSampleData: false,
          hasQualifyingData: false,
        }}
        onApplyPeriod={onApplyPeriod}
        periodBusy={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Adjust reporting period" }));
    expect(onApplyPeriod).toHaveBeenCalledTimes(1);
  });
});

describe("ValueReportIncludesSection", () => {
  it("lists sponsor report sections", () => {
    render(<ValueReportIncludesSection />);

    expect(screen.getByTestId("value-report-includes")).toBeInTheDocument();
    expect(screen.getByText("Sponsor report includes")).toBeInTheDocument();
    expect(screen.getByText("Finalized reviews")).toBeInTheDocument();
    expect(screen.getByText("Recommended next actions")).toBeInTheDocument();
  });
});
