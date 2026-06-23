import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { getShowcaseExecutiveHref } from "@/lib/buyer-safe-review-navigation";

vi.mock("@/components/SeedSampleReviewButton", () => ({
  SeedSampleReviewButton: () => <button type="button">Load sample workspace</button>,
}));

import { ExecutiveDashboardEmptyState } from "@/components/executive/ExecutiveDashboardEmptyState";

describe("ExecutiveDashboardEmptyState", () => {
  it("renders executive empty copy and primary actions", () => {
    const vocabulary = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

    render(<ExecutiveDashboardEmptyState />);

    expect(screen.getByTestId("executive-dashboard-empty-state")).toBeInTheDocument();
    expect(screen.getByText(vocabulary.emptyStateTitle)).toBeInTheDocument();
    expect(screen.getByText(vocabulary.emptyStateDescription)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: vocabulary.emptyStatePrimaryAction })).toHaveAttribute(
      "href",
      "/reviews/new",
    );
    expect(screen.getByRole("link", { name: vocabulary.emptyStateTertiaryAction })).toHaveAttribute(
      "href",
      getShowcaseExecutiveHref(),
    );
  });
});
