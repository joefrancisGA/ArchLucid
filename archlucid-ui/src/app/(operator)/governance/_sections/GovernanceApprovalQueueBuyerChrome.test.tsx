import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GOVERNANCE_APPROVAL_QUEUE_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/approval-queue-evidence-copy";

import { GovernanceApprovalQueueBuyerChrome } from "./GovernanceApprovalQueueBuyerChrome";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
}));

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
}));

describe("GovernanceApprovalQueueBuyerChrome", () => {
  it("renders Sources orientation in buyer-polished shell", () => {
    demoEnvMock.buyerPolished = true;

    render(<GovernanceApprovalQueueBuyerChrome />);

    expect(screen.getByTestId(GOVERNANCE_APPROVAL_QUEUE_ORIENTATION_BOTTOM_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("approval-queue-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("approval-queue-claim-discipline")).not.toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<GovernanceApprovalQueueBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
