import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
}));

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
}));

import { APPROVAL_LINEAGE_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/approval-lineage-evidence-copy";

import { GovernanceApprovalLineageBuyerChrome } from "./GovernanceApprovalLineageBuyerChrome";

describe("GovernanceApprovalLineageBuyerChrome", () => {
  it("renders Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<GovernanceApprovalLineageBuyerChrome />);

    expect(screen.getByTestId(APPROVAL_LINEAGE_ORIENTATION_BOTTOM_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("approval-lineage-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("approval-lineage-claim-discipline")).not.toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<GovernanceApprovalLineageBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
