import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceApprovalStatusBanner } from "@/components/governance/GovernanceApprovalStatusBanner";

describe("GovernanceApprovalStatusBanner", () => {
  it("renders approval copy and calm action links without arrow glyphs", () => {
    render(<GovernanceApprovalStatusBanner onRiskRegisterPage />);

    expect(screen.getByTestId("governance-approval-status-banner")).toBeInTheDocument();
    expect(screen.getByText("Governance approval record")).toBeInTheDocument();
    expect(screen.getByText(/Approved for governed use with monitored PHI minimization control/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View approval record" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View dispositions" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View audit trail" })).toBeInTheDocument();
    expect(screen.queryByText(/→/)).not.toBeInTheDocument();
  });

  it("includes dispositions link when not on the risk register page", () => {
    render(<GovernanceApprovalStatusBanner />);

    expect(screen.getByRole("link", { name: "View dispositions" })).toHaveAttribute("href", "/governance/findings");
  });
});
