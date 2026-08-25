import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceApprovalLineageNextRequestFooter } from "./GovernanceApprovalLineageNextRequestFooter";

describe("GovernanceApprovalLineageNextRequestFooter", () => {
  it("renders next approval lineage link", () => {
    render(
      <GovernanceApprovalLineageNextRequestFooter
        target={{
          approvalRequestId: "apr-2",
          title: "Promote claims",
          href: "/governance/approval-requests/apr-2/lineage",
        }}
      />,
    );

    expect(screen.getByTestId("approval-lineage-next-request-footer")).toBeInTheDocument();
    expect(screen.getByText("Next approval request")).toBeInTheDocument();
    expect(screen.getByTestId("approval-lineage-next-request-action")).toHaveAttribute(
      "href",
      "/governance/approval-requests/apr-2/lineage",
    );
  });
});
