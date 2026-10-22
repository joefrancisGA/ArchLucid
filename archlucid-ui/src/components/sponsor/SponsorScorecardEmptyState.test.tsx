import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

vi.mock("@/components/SeedSampleReviewButton", () => ({
  SeedSampleReviewButton: () => <button type="button">Load sample workspace</button>,
}));

import { SponsorScorecardEmptyState } from "@/components/sponsor/SponsorScorecardEmptyState";

describe("SponsorScorecardEmptyState", () => {
  it("renders scorecard empty copy and primary actions", () => {
    const vocabulary = BUYER_SPONSOR_SUMMARY_VOCABULARY;

    render(<SponsorScorecardEmptyState />);

    expect(screen.getByTestId("sponsor-scorecard-empty-state")).toBeInTheDocument();
    expect(screen.getByText(vocabulary.emptyStateTitle)).toBeInTheDocument();
    expect(screen.getByText(vocabulary.scorecardEmptyStateDescription)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: vocabulary.scorecardEmptyStatePrimaryAction })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(screen.getByRole("link", { name: vocabulary.scorecardEmptyStateTertiaryAction })).toHaveAttribute(
      "href",
      SPONSOR_DASHBOARD_HREF,
    );
  });

  it("keeps preview behind disclosure for first-viewport density (TB-1536)", () => {
    const vocabulary = BUYER_SPONSOR_SUMMARY_VOCABULARY;

    render(<SponsorScorecardEmptyState />);

    const primaryActions = screen.getAllByRole("link", { name: vocabulary.scorecardEmptyStatePrimaryAction });

    expect(primaryActions).toHaveLength(1);
    expect(screen.getByTestId("sponsor-scorecard-empty-preview-disclosure")).toBeInTheDocument();
    expect(screen.queryByTestId("sponsor-scorecard-empty-preview")).not.toBeVisible();

    fireEvent.click(screen.getByText(vocabulary.scorecardEmptyStatePreviewSectionTitle));

    expect(screen.getByTestId("sponsor-scorecard-empty-preview")).toBeVisible();
  });
});
