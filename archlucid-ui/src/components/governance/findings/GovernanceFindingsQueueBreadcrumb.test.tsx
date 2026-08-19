import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";

import { GovernanceFindingsQueueBreadcrumb } from "./GovernanceFindingsQueueBreadcrumb";

describe("GovernanceFindingsQueueBreadcrumb", () => {
  it("renders governance trail ending on Findings", () => {
    render(<GovernanceFindingsQueueBreadcrumb />);

    expect(screen.getByTestId("governance-findings-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Governance" })).toHaveAttribute("href", "/governance/approval-queue");
    expect(screen.getByText(BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE)).toBeInTheDocument();
  });
});
