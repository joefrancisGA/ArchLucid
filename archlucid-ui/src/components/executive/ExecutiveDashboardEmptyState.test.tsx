import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

vi.mock("@/components/SeedSampleReviewButton", () => ({
  SeedSampleReviewButton: ({ label }: { label: string }) => <button type="button">{label}</button>,
}));

import { ExecutiveDashboardEmptyState } from "@/components/executive/ExecutiveDashboardEmptyState";

describe("ExecutiveDashboardEmptyState", () => {
  it("renders empty copy with review-package actions and sample helper", () => {
    const vocabulary = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

    render(<ExecutiveDashboardEmptyState />);

    expect(screen.getByTestId("executive-dashboard-empty-state")).toBeInTheDocument();
    expect(screen.getByText(vocabulary.emptyStateTitle)).toBeInTheDocument();
    expect(screen.getByText(vocabulary.emptyStateDescription)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: vocabulary.emptyStatePrimaryAction })).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByRole("button", { name: vocabulary.emptyStateSecondaryAction })).toBeInTheDocument();
    expect(screen.getByText(vocabulary.emptyStateSecondaryHelper)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: vocabulary.emptyStateTertiaryAction })).toHaveAttribute("href", "/reviews");
  });
});
