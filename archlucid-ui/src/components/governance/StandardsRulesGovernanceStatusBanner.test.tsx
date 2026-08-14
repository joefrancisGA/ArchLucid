import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StandardsRulesGovernanceStatusBanner } from "@/components/governance/StandardsRulesGovernanceStatusBanner";

describe("StandardsRulesGovernanceStatusBanner", () => {
  it("renders standards-focused governance copy and calm links without arrows", () => {
    render(<StandardsRulesGovernanceStatusBanner />);

    expect(screen.getByTestId("standards-rules-governance-status-banner")).toBeInTheDocument();
    expect(screen.getByText("Governance approval record")).toBeInTheDocument();
    expect(screen.getByText(/approved using the standards and rules shown below/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View sealed review record" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View evidence trail" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View audit trail" })).toBeInTheDocument();
    expect(screen.queryByText(/→/)).not.toBeInTheDocument();
  });
});
