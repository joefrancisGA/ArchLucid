import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/decision-register",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { DecisionRegisterFiltersPanel } from "./DecisionRegisterFiltersPanel";
import { DECISION_REGISTER_DATE_PRESET_30_LABEL } from "./decision-register-copy";
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
        onClearFilters={vi.fn()}
        currentSearch=""
      />,
    );

    expect(screen.getByText(OPERATOR_DATE_RANGE_START_LABEL)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_DATE_RANGE_END_LABEL)).toBeInTheDocument();
    expect(screen.queryByText("Recorded after")).not.toBeInTheDocument();
    expect(screen.queryByText("Recorded before")).not.toBeInTheDocument();
  });

  it("uses FilterChip date presets instead of filled primary buttons (TB-2293)", () => {
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
        onClearFilters={vi.fn()}
        currentSearch=""
      />,
    );

    const last30 = screen.getByRole("link", { name: /Date range:\s*Last 30 days/i });

    expect(last30).toHaveAttribute("aria-current", "page");
    expect(last30.className).not.toContain("--al-primary-action-bg");
  });
});
