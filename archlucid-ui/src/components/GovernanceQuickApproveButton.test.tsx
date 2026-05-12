import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GovernanceQuickApproveButton } from "@/components/GovernanceQuickApproveButton";

const getApprovalRequestLineage = vi.fn();
const batchReviewGovernanceApprovalRequests = vi.fn();

vi.mock("@/lib/api", () => ({
  getApprovalRequestLineage: (...args: unknown[]) => getApprovalRequestLineage(...args),
  batchReviewGovernanceApprovalRequests: (...args: unknown[]) => batchReviewGovernanceApprovalRequests(...args),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

describe("GovernanceQuickApproveButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hides control when lineage reports Critical / Error severities", async () => {
    getApprovalRequestLineage.mockResolvedValue({
      topFindings: [{ severity: "Critical" }],
    });

    const onApproved = vi.fn();

    render(
      <GovernanceQuickApproveButton
        approvalRequestId="a1"
        status="Submitted"
        canExecute
        reviewedBy="Reviewer"
        onApproved={onApproved}
      />,
    );

    await waitFor(() => {
      expect(getApprovalRequestLineage).toHaveBeenCalledWith("a1");
    });

    await waitFor(() => {
      expect(screen.queryByTestId("governance-quick-approve")).not.toBeInTheDocument();
    });
    expect(onApproved).not.toHaveBeenCalled();
  });

  it("calls batch-review approve and onApproved on success", async () => {
    getApprovalRequestLineage.mockResolvedValue({
      topFindings: [{ severity: "Warning" }],
    });
    batchReviewGovernanceApprovalRequests.mockResolvedValue({
      results: [{ approvalRequestId: "a1", succeeded: true }],
    });

    const onApproved = vi.fn().mockResolvedValue(undefined);

    render(
      <GovernanceQuickApproveButton
        approvalRequestId="a1"
        status="Submitted"
        canExecute
        reviewedBy=""
        onApproved={onApproved}
      />,
    );

    const quickBtn = await screen.findByTestId("governance-quick-approve");

    fireEvent.click(quickBtn);

    await waitFor(() => {
      expect(batchReviewGovernanceApprovalRequests).toHaveBeenCalledWith(
        expect.objectContaining({
          approvalRequestIds: ["a1"],
          decision: "approve",
        }),
      );
    });

    expect(onApproved).toHaveBeenCalled();
  });
});
