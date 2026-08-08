import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { GovernanceQuickApproveButton } from "@/components/GovernanceQuickApproveButton";

import { GOVERNANCE_QUICK_APPROVE_DEFAULT_REVIEW_COMMENT } from "@/components/GovernanceQuickApproveDialog";

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

const defaultProps = {

  approvalRequestId: "a1",

  runId: "run-42",

  approvalSubject: "Promote staging manifest",

  status: "Submitted",

  canExecute: true,

  reviewedBy: "Reviewer",

  onApproved: vi.fn(),

} as const;

describe("GovernanceQuickApproveButton", () => {

  beforeEach(() => {

    vi.clearAllMocks();

  });

  it("hides control when lineage reports Critical / Error severities", async () => {

    getApprovalRequestLineage.mockResolvedValue({

      topFindings: [{ severity: "Critical" }],

    });

    const onApproved = vi.fn();

    render(<GovernanceQuickApproveButton {...defaultProps} onApproved={onApproved} />);

    await waitFor(() => {

      expect(getApprovalRequestLineage).toHaveBeenCalledWith("a1");

    });

    await waitFor(() => {

      expect(screen.queryByTestId("governance-quick-approve")).not.toBeInTheDocument();

    });

    expect(onApproved).not.toHaveBeenCalled();

  });

  it("opens confirmation dialog and submits default review comment on confirm", async () => {

    getApprovalRequestLineage.mockResolvedValue({

      topFindings: [{ severity: "Warning" }],

    });

    batchReviewGovernanceApprovalRequests.mockResolvedValue({

      results: [{ approvalRequestId: "a1", succeeded: true }],

    });

    const onApproved = vi.fn().mockResolvedValue(undefined);

    render(<GovernanceQuickApproveButton {...defaultProps} reviewedBy="" onApproved={onApproved} />);

    const quickBtn = await screen.findByTestId("governance-quick-approve");

    fireEvent.click(quickBtn);

    expect(await screen.findByTestId("governance-quick-approve-dialog")).toBeInTheDocument();

    expect(screen.getByText("Promote staging manifest")).toBeInTheDocument();

    expect(screen.getByText("run-42")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("governance-quick-approve-confirm"));

    await waitFor(() => {

      expect(batchReviewGovernanceApprovalRequests).toHaveBeenCalledWith(

        expect.objectContaining({

          approvalRequestIds: ["a1"],

          decision: "approve",

          reviewComment: GOVERNANCE_QUICK_APPROVE_DEFAULT_REVIEW_COMMENT,

        }),

      );

    });

    expect(onApproved).toHaveBeenCalled();

  });

  it("uses approver note as reviewComment when provided", async () => {

    getApprovalRequestLineage.mockResolvedValue({

      topFindings: [],

    });

    batchReviewGovernanceApprovalRequests.mockResolvedValue({

      results: [{ approvalRequestId: "a1", succeeded: true }],

    });

    const onApproved = vi.fn().mockResolvedValue(undefined);

    render(<GovernanceQuickApproveButton {...defaultProps} onApproved={onApproved} />);

    fireEvent.click(await screen.findByTestId("governance-quick-approve"));

    fireEvent.change(screen.getByLabelText("Approver note (optional)"), {

      target: { value: "Reviewed with architecture board sign-off." },

    });

    fireEvent.click(screen.getByTestId("governance-quick-approve-confirm"));

    await waitFor(() => {

      expect(batchReviewGovernanceApprovalRequests).toHaveBeenCalledWith(

        expect.objectContaining({

          reviewComment: "Reviewed with architecture board sign-off.",

        }),

      );

    });

  });

});

