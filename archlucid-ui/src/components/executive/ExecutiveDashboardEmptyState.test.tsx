import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

import { ExecutiveDashboardEmptyState } from "@/components/executive/ExecutiveDashboardEmptyState";

describe("ExecutiveDashboardEmptyState", () => {
  it("renders short empty copy and preview without duplicate action buttons", () => {
    const vocabulary = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

    render(<ExecutiveDashboardEmptyState />);

    expect(screen.getByTestId("executive-dashboard-empty-state")).toBeInTheDocument();
    expect(screen.getByText(vocabulary.emptyStateTitle)).toBeInTheDocument();
    expect(screen.getByText(vocabulary.emptyStateDescription)).toBeInTheDocument();
    expect(screen.getByTestId("executive-dashboard-empty-preview")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: vocabulary.emptyStatePrimaryAction })).not.toBeInTheDocument();
  });
});
