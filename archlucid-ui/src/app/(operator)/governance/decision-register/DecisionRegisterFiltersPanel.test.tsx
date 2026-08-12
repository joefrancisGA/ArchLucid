import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DecisionRegisterFiltersPanel } from "./DecisionRegisterFiltersPanel";
import {
  OPERATOR_DATE_RANGE_END_LABEL,
  OPERATOR_DATE_RANGE_START_LABEL,
} from "@/lib/operator-date-range-copy";

describe("DecisionRegisterFiltersPanel (TB-2013)", () => {
  it("uses Start date / End date labels instead of Recorded after/before", () => {
    render(
      <DecisionRegisterFiltersPanel
        category=""
        recordedAfter=""
        recordedBefore=""
        minConfidence=""
        maxConfidence=""
        confidenceBasis=""
        datePreset="30"
        collapseAdvanced={false}
        onCategoryChange={vi.fn()}
        onRecordedAfterChange={vi.fn()}
        onRecordedBeforeChange={vi.fn()}
        onMinConfidenceChange={vi.fn()}
        onMaxConfidenceChange={vi.fn()}
        onConfidenceBasisChange={vi.fn()}
        onDatePresetChange={vi.fn()}
        onClearFilters={vi.fn()}
      />,
    );

    expect(screen.getByText(OPERATOR_DATE_RANGE_START_LABEL)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_DATE_RANGE_END_LABEL)).toBeInTheDocument();
    expect(screen.queryByText("Recorded after")).not.toBeInTheDocument();
    expect(screen.queryByText("Recorded before")).not.toBeInTheDocument();
  });
});
