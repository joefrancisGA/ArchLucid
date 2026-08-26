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

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: vi.fn(() => false),
  };
});

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ replace: vi.fn() }),
    useSearchParams: vi.fn(() => new URLSearchParams("runId=run-scorecard-test")),
  };
});

vi.mock("@/components/usability/ValueReportOutcomesNav", () => ({
  ValueReportOutcomesNav: () => <nav data-testid="value-report-outcomes-nav" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

vi.mock("@/components/ScorecardRoiVocabularyRail", () => ({
  ScorecardRoiVocabularyRail: () => <div data-testid="scorecard-roi-vocabulary" />,
}));

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "workspace-run-1", setRunId: vi.fn() }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker" />,
}));

vi.mock("./ScorecardNextReviewFooterClient", () => ({
  ScorecardNextReviewFooterClient: () => <div data-testid="scorecard-next-review-footer-stub" />,
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
    assumptionsComplete: false,
    assumptionsDirty: false,
    canExecute: true,
    canSaveAssumptions: false,
    data: scorecardData,
    error: null,
    fieldErrors: { hours: null, reviews: null, rate: null },
    hours: "",
    livePreview: null,
    metricsAsOfUtc: null,
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
    mockUseSearchParams.mockReturnValue(new URLSearchParams("runId=run-scorecard-test"));
  });

  it("mounts contextual help (TB-1959)", () => {
    render(<PilotScorecardPageView model={buildModel()} />);

    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });

  it("renders Sources strip and directional claim discipline (SCX Evidence)", () => {
    render(<PilotScorecardPageView model={buildModel()} />);

    expect(screen.getByTestId("architecture-scorecard-sources")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sources" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sources for follow-up" })).toBeNull();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
  });

  it("uses consistent Architecture scorecard labeling and customer-safe subtitle", () => {
    render(<PilotScorecardPageView model={buildModel()} />);

    expect(screen.getByRole("heading", { name: "Architecture scorecard" })).toBeInTheDocument();
    expect(screen.getByText(/See review throughput, governance effectiveness, and estimated ROI/i)).toBeInTheDocument();
    expect(screen.queryByText(/ROI_MODEL/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/roiEstimate/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SOURCE:/i)).not.toBeInTheDocument();
  });

  it("shows review picker when no runId is scoped", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());

    render(<PilotScorecardPageView model={buildModel()} />);

    expect(screen.getByTestId("scorecard-pick-review-before-metrics-strip")).toBeInTheDocument();
    expect(screen.queryByTestId("review-scorecard-summary-row")).not.toBeInTheDocument();
  });

  it("renders savings hero, primary KPIs, and ROI calculator layout", () => {
    render(<PilotScorecardPageView model={buildModel()} />);

    expect(screen.getByTestId("review-scorecard-summary-row")).toBeInTheDocument();
    expect(screen.getByTestId("scorecard-summary-estimated-review-time-savings")).toBeInTheDocument();
    expect(screen.getByTestId("scorecard-summary-reviews-finalized")).toBeInTheDocument();
    expect(screen.getByTestId("scorecard-summary-resolve-outcomes")).toBeInTheDocument();
    expect(screen.queryByTestId("scorecard-summary-findings-affirmed")).not.toBeInTheDocument();
    expect(screen.getByText("Operational metrics")).toBeInTheDocument();
    expect(screen.getByTestId("review-scorecard-roi-assumptions")).toHaveClass("grid");
    expect(screen.getByText("ROI assumptions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save ROI assumptions" })).toBeInTheDocument();
  });

  it("shows an sponsor-ready empty state when no reviews are committed", () => {
    render(
      <PilotScorecardPageView
        model={buildModel({
          data: { ...scorecardData, totalRunsCommitted: 0, totalManifestsCreated: 0 },
        })}
      />,
    );

    expect(screen.getByTestId("review-scorecard-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No finalized reviews yet")).toBeInTheDocument();
    expect(screen.getByText(REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: REVIEW_SCORECARD_EMPTY_PREVIEW_SECTION_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: REVIEW_SCORECARD_EMPTY_PRIMARY_CTA })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(screen.getByRole("link", { name: REVIEW_SCORECARD_EMPTY_SECONDARY_CTA })).toHaveAttribute(
      "href",
      "/architecture/reviews",
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
