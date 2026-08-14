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
    expect(screen.getAllByLabelText("Status: Required").length).toBeGreaterThan(0);
    expect(screen.getByTestId("finding-evidence-link-chip")).toBeInTheDocument();
    expect(screen.getByTestId("standards-rules-refresh")).toBeInTheDocument();
    expect(screen.getByTestId("governance-resolution-export-markdown")).toBeInTheDocument();
    expect(screen.getByText("PHI minimization required")).toBeInTheDocument();
    expect(screen.queryByText(/Submit for governance approval/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Approval queue/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Step 4 of 5/i)).not.toBeInTheDocument();
  });
});
