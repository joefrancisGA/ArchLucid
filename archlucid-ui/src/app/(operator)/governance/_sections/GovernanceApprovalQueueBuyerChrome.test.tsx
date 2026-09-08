import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceApprovalQueueBuyerChrome } from "@/app/(operator)/governance/_sections/GovernanceApprovalQueueBuyerChrome";

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

    expect(screen.getByTestId("governance-approval-queue-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("approval-queue-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("approval-queue-claim-discipline")).not.toBeInTheDocument();
  });

  it("renders nothing outside buyer-polished shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<GovernanceApprovalQueueBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
