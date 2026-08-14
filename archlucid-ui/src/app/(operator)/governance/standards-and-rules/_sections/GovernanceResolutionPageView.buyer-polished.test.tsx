import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceResolutionPageView } from "./GovernanceResolutionPageView";
import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";

function buildModel(overrides: Partial<GovernanceResolutionPageViewModel> = {}): GovernanceResolutionPageViewModel {
  return {
    buyerPolishedShell: true,
    canMutateEnterprisePolicySurfaces: false,
    data: null,
    loading: false,
    failure: null,
    load: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("GovernanceResolutionPageView buyer-polished shell", () => {
  it("renders standards/rules inspection content instead of approval workflow", () => {
    render(<GovernanceResolutionPageView model={buildModel()} />);

    expect(screen.getByTestId("standards-rules-governance-status-banner")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Standards & rules", level: 2 })).toBeInTheDocument();
    expect(
      screen.getByText(/Review the standards, policy rules, and checks applied to this review/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("standards-rules-summary-strip")).toBeInTheDocument();
    expect(screen.getByTestId("standards-rules-table")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Severity: High").length).toBeGreaterThan(0);
    expect(screen.getByTestId("standards-rules-review-context-row")).toBeInTheDocument();
    expect(screen.getByTestId("standards-rules-filter-count")).toHaveTextContent(/Showing \d+ of \d+ rules/);
    expect(screen.getAllByLabelText("Status: Required").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Status: Not evidenced").length).toBeGreaterThan(0);
    expect(screen.getByTestId("finding-evidence-link-chip")).toBeInTheDocument();
    expect(screen.getByTestId("standards-rules-refresh")).toBeInTheDocument();
    expect(screen.getByTestId("governance-resolution-export-rules")).toBeInTheDocument();
    expect(screen.getByText("PHI minimization required")).toBeInTheDocument();
    expect(screen.queryByText(/Submit for governance approval/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Approval queue/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Step 4 of 5/i)).not.toBeInTheDocument();
  });

  it("hides the governance banner when the page load fails", () => {
    render(
      <GovernanceResolutionPageView
        model={buildModel({
          failure: {
            message: "Failed to load governance resolution",
            problem: null,
            correlationId: null,
          },
        })}
      />,
    );

    expect(screen.queryByTestId("standards-rules-governance-status-banner")).not.toBeInTheDocument();
    expect(screen.queryByTestId("standards-rules-review-context-row")).not.toBeInTheDocument();
    expect(screen.getByTestId("governance-resolution-export-rules")).toBeDisabled();
    expect(screen.queryByTestId("standards-rules-table")).not.toBeInTheDocument();
  });
});
