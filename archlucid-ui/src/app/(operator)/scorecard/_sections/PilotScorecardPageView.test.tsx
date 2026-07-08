import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PilotScorecardPageView } from "@/app/(operator)/scorecard/_sections/PilotScorecardPageView";
import type { UsePilotScorecardPageModel } from "@/app/(operator)/scorecard/_sections/use-pilot-scorecard-page";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";

vi.mock("@/components/usability/ValueReportOutcomesNav", () => ({
  ValueReportOutcomesNav: () => <nav data-testid="value-report-outcomes-nav" />,
}));

const scorecardData: PilotScorecardJson = {
  tenantId: "00000000-0000-0000-0000-000000000001",
  totalRunsCommitted: 2,
  totalManifestsCreated: 1,
  totalFindingsResolved: 4,
  averageTimeToManifestMinutes: 45,
  totalAuditEventsGenerated: 8,
  totalGovernanceApprovalsCompleted: 1,
  firstCommitUtc: "2026-01-01T00:00:00.000Z",
  daysSinceFirstCommit: 20,
  metricSources: { totalRunsCommitted: "measured" },
  baselines: null,
  roiEstimate: null,
};

function buildModel(overrides: Partial<UsePilotScorecardPageModel> = {}): UsePilotScorecardPageModel {
  return {
    canExecute: true,
    data: scorecardData,
    error: null,
    hours: "",
    onSaveBaselines: vi.fn(async () => undefined),
    rate: "",
    reviews: "",
    saving: false,
    setHours: vi.fn(),
    setRate: vi.fn(),
    setReviews: vi.fn(),
    resolvedAnnualSavingsLabel: null,
    resolvedQuarterlySavingsLabel: null,
    resolvedStatusQuoCostLabel: null,
    ...overrides,
  };
}

describe("PilotScorecardPageView", () => {
  it("uses consistent Review scorecard labeling and customer-safe subtitle", () => {
    render(<PilotScorecardPageView model={buildModel()} />);

    expect(screen.getByRole("heading", { name: "Review scorecard" })).toBeInTheDocument();
    expect(screen.getByText(/Track review throughput, evidence-backed decisions/i)).toBeInTheDocument();
    expect(screen.queryByText(/ROI_MODEL/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/roiEstimate/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SOURCE:/i)).not.toBeInTheDocument();
  });

  it("renders executive summary row and polished ROI assumptions", () => {
    render(<PilotScorecardPageView model={buildModel()} />);

    expect(screen.getByTestId("review-scorecard-summary-row")).toBeInTheDocument();
    expect(screen.getByText("ROI assumptions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save ROI assumptions" })).toBeInTheDocument();
    expect(screen.getByText("Complete ROI assumptions to calculate estimated savings.")).toBeInTheDocument();
  });

  it("shows an intentional empty state when no reviews are committed", () => {
    render(
      <PilotScorecardPageView
        model={buildModel({
          data: { ...scorecardData, totalRunsCommitted: 0, totalManifestsCreated: 0 },
        })}
      />,
    );

    expect(screen.getByTestId("review-scorecard-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No committed reviews yet")).toBeInTheDocument();
    expect(screen.queryByTestId("review-scorecard-summary-row")).not.toBeInTheDocument();
  });
});
