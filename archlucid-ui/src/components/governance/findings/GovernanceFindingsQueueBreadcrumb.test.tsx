import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";

import { GovernanceFindingsQueueBreadcrumb } from "./GovernanceFindingsQueueBreadcrumb";

describe("GovernanceFindingsQueueBreadcrumb", () => {
  it("defers to page titles after TB-2090 breadcrumb removal", () => {
    render(<GovernanceFindingsQueueBreadcrumb />);

    expect(screen.queryByTestId("governance-findings-breadcrumb")).not.toBeInTheDocument();
    expect(BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE.length).toBeGreaterThan(0);
  });
});
