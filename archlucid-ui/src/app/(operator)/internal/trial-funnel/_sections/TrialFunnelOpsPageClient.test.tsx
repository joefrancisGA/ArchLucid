import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { TrialFunnelOpsPageClient } from "@/app/(operator)/internal/trial-funnel/_sections/TrialFunnelOpsPageClient";
import { TRIAL_FUNNEL_PAGE_SUBTITLE } from "@/lib/trial-funnel-metric-contract";

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: 4,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/lib/trial-funnel-ops", () => ({
  fetchTrialFunnelOperationalSummary: vi.fn().mockResolvedValue({
    activeSelfServiceTrials: 2,
    signupAttempts30Days: 5,
    signupFailures30Days: 0,
    firstCommittedReviews30Days: 3,
    trialConversions30Days: 1,
    billingCheckouts30Days: 0,
    medianSignupToFirstCommitSeconds: 3600,
    estimatedFirstReviewCogsUsdLow: 1,
    estimatedFirstReviewCogsUsdMid: 2,
    estimatedFirstReviewCogsUsdHigh: 3,
    llmBudgetCutoffEvents30Days: 0,
    cogsBasisLabel: "estimated",
    dataQuality: {
      generatedAtUtc: "2026-07-13T12:00:00Z",
      periodDays: 30,
      comparePreviousPeriod: false,
      excludesDemoWorkspaces: true,
      conversionDefinition: "Conversion counts converted trials.",
      instrumentationWarning: null,
      stageDefinitions: ["Trial started — signup event."],
    },
    stages: [
      {
        stageId: "trial-started",
        label: "Trial started",
        count: 5,
        percentOfTrialStarts: 100,
        percentFromPreviousStage: null,
        medianHoursFromPreviousStage: null,
        previousPeriodCount: null,
      },
    ],
    timing: {
      medianTrialStartToFirstReviewFinalizedHours: 2,
      medianTrialStartToFirstReviewFinalizedSampleSize: 3,
      medianTrialStartToConversionHours: null,
      medianTrialStartToConversionSampleSize: null,
    },
    firstReviewCost: {
      medianEstimatedUsd: 18.4,
      lowEstimatedUsd: 9,
      highEstimatedUsd: 34,
      sampleSize: 3,
      currencyCode: "USD",
      basisLabel: "estimated",
      status: "estimated",
      statusDetail: "Estimated from recorded token usage and configured provider rates.",
    },
    cohortRows: [],
  }),
}));

describe("TrialFunnelOpsPageClient", () => {
  it("renders operational subtitle without roadmap language", async () => {
    render(<TrialFunnelOpsPageClient />);

    expect(await screen.findByText(TRIAL_FUNNEL_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("trial-funnel-claim-discipline")).toBeInTheDocument();
    expect(screen.queryByText(/no live stripe claims/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sales-led checkout remains deferred/i)).not.toBeInTheDocument();
  });

  it("shows funnel and timing sections", async () => {
    render(<TrialFunnelOpsPageClient />);

    expect(await screen.findByText("Funnel overview")).toBeInTheDocument();
    expect(screen.getByText("Activation and review timing")).toBeInTheDocument();
    expect(screen.getAllByText("First-review AI cost").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });
});
