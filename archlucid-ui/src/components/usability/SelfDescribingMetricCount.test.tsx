import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SelfDescribingMetricCount } from "@/components/usability/SelfDescribingMetricCount";
import {
  operatorHomeActiveReviewsPresentation,
  workspaceOpenFindingsPresentation,
} from "@/lib/metric-count-presentation";

describe("SelfDescribingMetricCount", () => {
  it("renders a scoped clickable count", () => {
    render(
      <SelfDescribingMetricCount
        presentation={workspaceOpenFindingsPresentation(4)}
        testId="home-open-findings-metric"
      />,
    );

    expect(screen.getByTestId("home-open-findings-metric")).toHaveAttribute(
      "href",
      "/governance/findings?filter=open",
    );
    expect(screen.getByText(/open findings · this workspace/i)).toBeInTheDocument();
  });

  it("uses middle-dot separators and suppresses redundant scope labels", () => {
    render(
      <SelfDescribingMetricCount
        presentation={operatorHomeActiveReviewsPresentation(2)}
        testId="home-active-reviews-metric"
      />,
    );

    expect(screen.getByText("active reviews")).toBeInTheDocument();
    expect(screen.queryByText(/active reviews · active/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("home-active-reviews-metric")).toHaveAttribute(
      "aria-label",
      "2 active reviews",
    );
  });

  it("renders quiet zero tiles without kpi scale", () => {
    render(
      <SelfDescribingMetricCount
        presentation={operatorHomeActiveReviewsPresentation(0)}
        testId="home-active-reviews-zero"
        valueVariant="quiet"
      />,
    );

    const value = screen.getByTestId("home-active-reviews-zero-value");

    expect(value).toHaveTextContent("0");
    expect(value.className).not.toMatch(/text-4xl/);
  });
});
