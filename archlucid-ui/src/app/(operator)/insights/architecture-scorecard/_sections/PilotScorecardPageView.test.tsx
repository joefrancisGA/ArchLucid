import { render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PilotScorecardPageView } from "@/app/(operator)/insights/architecture-scorecard/_sections/PilotScorecardPageView";
import type { UsePilotScorecardPageModel } from "@/app/(operator)/insights/architecture-scorecard/_sections/use-pilot-scorecard-page";
import {
  REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE,
  REVIEW_SCORECARD_EMPTY_PRIMARY_CTA,
  REVIEW_SCORECARD_EMPTY_SECONDARY_CTA,
  REVIEW_SCORECARD_EMPTY_PREVIEW_SECTION_TITLE,
  REVIEW_SCORECARD_EMPTY_TERTIARY_CTA,
  REVIEW_SCORECARD_SAMPLE_HREF,
} from "@/lib/review-scorecard-empty-state";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("@/components/usability/ValueReportOutcomesNav", () => ({
  ValueReportOutcomesNav: () => <nav data-testid="value-report-outcomes-nav" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

const mockUseSearchParams = vi.mocked(useSearchParams);

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
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("mounts contextual help (TB-1959)", () => {
    render(<PilotScorecardPageView model={buildModel()} />);

    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });

  it("uses consistent Architecture scorecard labeling and customer-safe subtitle", () => {
    render(<PilotScorecardPageView model={buildModel()} />);

    expect(screen.getByRole("heading", { name: "Architecture scorecard" })).toBeInTheDocument();
    expect(screen.getByText(/Track architecture review throughput, evidence-backed decisions/i)).toBeInTheDocument();
    expect(screen.queryByText(/ROI_MODEL/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/roiEstimate/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SOURCE:/i)).not.toBeInTheDocument();
  });

  it("renders executive summary row and polished ROI assumptions", () => {
    render(<PilotScorecardPageView model={buildModel()} />);

    expect(screen.getByTestId("review-scorecard-summary-row")).toBeInTheDocument();
    expect(screen.getByTestId("review-scorecard-roi-assumptions")).toHaveClass("max-w-md");
    expect(screen.getByText("ROI assumptions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save ROI assumptions" })).toBeInTheDocument();
    expect(screen.getByText("Complete ROI assumptions to calculate estimated savings.")).toBeInTheDocument();
  });

  it("shows an executive-ready empty state when no reviews are committed", () => {
    render(
      <PilotScorecardPageView
        model={buildModel({
          data: { ...scorecardData, totalRunsCommitted: 0, totalManifestsCreated: 0 },
        })}
      />,
    );

    expect(screen.getByTestId("review-scorecard-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No committed reviews yet")).toBeInTheDocument();
    expect(screen.getByText(REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: REVIEW_SCORECARD_EMPTY_PREVIEW_SECTION_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: REVIEW_SCORECARD_EMPTY_PRIMARY_CTA })).toHaveAttribute(
      "href",
      "/reviews/new",
    );
    expect(screen.getByRole("link", { name: REVIEW_SCORECARD_EMPTY_SECONDARY_CTA })).toHaveAttribute(
      "href",
      "/reviews",
    );
    expect(screen.getByRole("link", { name: REVIEW_SCORECARD_EMPTY_TERTIARY_CTA })).toHaveAttribute(
      "href",
      REVIEW_SCORECARD_SAMPLE_HREF,
    );
    expect(screen.getByTestId("review-scorecard-empty-preview")).toBeInTheDocument();
    expect(screen.queryByTestId("review-scorecard-summary-row")).not.toBeInTheDocument();
  });

  it("renders the sample scorecard when sample=1 is present", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("sample=1"));

    render(
      <PilotScorecardPageView
        model={buildModel({
          data: { ...scorecardData, totalRunsCommitted: 0, totalManifestsCreated: 0 },
        })}
      />,
    );

    expect(screen.getByTestId("review-scorecard-sample-banner")).toBeInTheDocument();
    expect(screen.getByTestId("review-scorecard-summary-row")).toBeInTheDocument();
    expect(screen.queryByTestId("review-scorecard-empty-state")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save ROI assumptions" })).toBeDisabled();
  });
});
