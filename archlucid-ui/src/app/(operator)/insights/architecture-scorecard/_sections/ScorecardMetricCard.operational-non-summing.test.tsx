import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScorecardMetricCard } from "./ScorecardMetricCard";
import { PILOT_SCORECARD_OPERATIONAL_METRIC_ROI_NON_SUMMING_LINE } from "@/lib/scorecard/pilot-scorecard-headline-band-roi-non-summing-copy";

describe("ScorecardMetricCard operational non-summing", () => {
  it("renders operational non-summing line on metric cards", () => {
    render(
      <ScorecardMetricCard
        title="Open risks"
        value="12"
        detail="Sample detail."
        metricState="measured"
      />,
    );

    expect(screen.getByTestId("scorecard-operational-non-summing-open-risks")).toHaveTextContent(
      PILOT_SCORECARD_OPERATIONAL_METRIC_ROI_NON_SUMMING_LINE.slice(0, 24),
    );
  });
});