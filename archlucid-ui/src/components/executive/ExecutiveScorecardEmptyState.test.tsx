import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

vi.mock("@/components/SeedSampleReviewButton", () => ({
  SeedSampleReviewButton: () => <button type="button">Load sample workspace</button>,
}));

import { ExecutiveScorecardEmptyState } from "@/components/executive/ExecutiveScorecardEmptyState";

describe("ExecutiveScorecardEmptyState", () => {
  it("renders scorecard empty copy and primary actions", () => {
    const vocabulary = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

    render(<ExecutiveScorecardEmptyState />);

    expect(screen.getByTestId("executive-scorecard-empty-state")).toBeInTheDocument();
    expect(screen.getByText(vocabulary.emptyStateTitle)).toBeInTheDocument();
    expect(screen.getByText(vocabulary.scorecardEmptyStateDescription)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: vocabulary.scorecardEmptyStatePrimaryAction })).toHaveAttribute(
      "href",
      "/reviews/new",
    );
    expect(screen.getByRole("link", { name: vocabulary.scorecardEmptyStateTertiaryAction })).toHaveAttribute(
      "href",
      "/executive/dashboard",
    );
    expect(screen.getByTestId("executive-scorecard-empty-preview")).toBeInTheDocument();
  });
});
