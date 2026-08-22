import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceStandardsRulesBreadcrumb } from "./GovernanceStandardsRulesBreadcrumb";

describe("GovernanceStandardsRulesBreadcrumb", () => {
  it("renders governance trail ending on Standards & rules", () => {
    render(<GovernanceStandardsRulesBreadcrumb />);

    expect(screen.getByTestId("governance-standards-rules-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Approval" })).toHaveAttribute("href", "/governance/approval-queue");
    expect(screen.getByText("Standards & rules")).toBeInTheDocument();
  });
});
