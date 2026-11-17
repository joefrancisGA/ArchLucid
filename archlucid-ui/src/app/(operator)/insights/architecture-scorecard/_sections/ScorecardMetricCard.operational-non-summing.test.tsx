import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScorecardMetricCard, ScorecardSavingsHero } from "./ScorecardMetricCard";
import {
  PILOT_SCORECARD_OPERATIONAL_METRIC_ROI_NON_SUMMING_LINE,
  PILOT_SCORECARD_QUARTERLY_BAND_ROI_NON_SUMMING_LINE,
} from "@/lib/scorecard/pilot-scorecard-headline-band-roi-non-summing-copy";

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

  it("renders quarterly non-summing on savings hero when secondary label is set", () => {
    render(
      <ScorecardSavingsHero
        detail="Sample."
        empty={false}
        value="$12k"
        secondaryLabel="About $3k per quarter (model)"
      />,
    );

    expect(screen.getByTestId("scorecard-savings-hero-quarterly-non-summing")).toHaveTextContent(
      PILOT_SCORECARD_QUARTERLY_BAND_ROI_NON_SUMMING_LINE.slice(0, 24),
    );
  });
});