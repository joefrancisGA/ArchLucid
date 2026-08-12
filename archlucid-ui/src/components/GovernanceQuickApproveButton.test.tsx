import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { GovernanceQuickApproveButton } from "@/components/GovernanceQuickApproveButton";
import { GOVERNANCE_QUICK_APPROVE_DEFAULT_REVIEW_COMMENT } from "@/components/GovernanceQuickApproveDialog";
import {
  GOVERNANCE_QUICK_APPROVE_FAILURE_MESSAGE,
  GOVERNANCE_QUICK_APPROVE_SUCCESS_MESSAGE,
} from "@/lib/governance-mutation-outcome-copy";

const getApprovalRequestLineage = vi.fn();
const batchReviewGovernanceApprovalRequests = vi.fn();

vi.mock("@/lib/api", () => ({
  getApprovalRequestLineage: (...args: unknown[]) => getApprovalRequestLineage(...args),
  batchReviewGovernanceApprovalRequests: (...args: unknown[]) => batchReviewGovernanceApprovalRequests(...args),
}));

const showSuccess = vi.fn();
const showError = vi.fn();

vi.mock("@/lib/toast", () => ({
  showSuccess: (...args: unknown[]) => showSuccess(...args),
  showError: (...args: unknown[]) => showError(...args),
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

  it("opens confirmation dialog and shows durable success after confirm", async () => {
    getApprovalRequestLineage.mockResolvedValue({
      topFindings: [{ severity: "Warning" }],
    });

    batchReviewGovernanceApprovalRequests.mockResolvedValue({
      results: [{ approvalRequestId: "a1", succeeded: true }],
    });

    const onApproved = vi.fn().mockResolvedValue(undefined);

    render(<GovernanceQuickApproveButton {...defaultProps} reviewedBy="" onApproved={onApproved} />);

    fireEvent.click(await screen.findByTestId("governance-quick-approve"));

    expect(await screen.findByTestId("governance-quick-approve-dialog")).toBeInTheDocument();
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
    expect(await screen.findByTestId("governance-quick-approve-success-callout")).toHaveTextContent(
      GOVERNANCE_QUICK_APPROVE_SUCCESS_MESSAGE,
    );
    expect(showSuccess).not.toHaveBeenCalled();
    expect(showError).not.toHaveBeenCalled();
  });

  it("shows inline dialog error instead of toast when approve fails", async () => {
    getApprovalRequestLineage.mockResolvedValue({
      topFindings: [],
    });

    batchReviewGovernanceApprovalRequests.mockResolvedValue({
      results: [{ approvalRequestId: "a1", succeeded: false, message: "Separation of duties blocked." }],
    });

    render(<GovernanceQuickApproveButton {...defaultProps} onApproved={vi.fn()} />);

    fireEvent.click(await screen.findByTestId("governance-quick-approve"));
    fireEvent.click(screen.getByTestId("governance-quick-approve-confirm"));

    expect(await screen.findByTestId("governance-quick-approve-inline-error")).toHaveTextContent(
      "Separation of duties blocked.",
    );
    expect(showError).not.toHaveBeenCalled();
  });

  it("shows default inline dialog error when approve fails without message", async () => {
    getApprovalRequestLineage.mockResolvedValue({
      topFindings: [],
    });

    batchReviewGovernanceApprovalRequests.mockResolvedValue({
      results: [{ approvalRequestId: "a1", succeeded: false }],
    });

    render(<GovernanceQuickApproveButton {...defaultProps} onApproved={vi.fn()} />);

    fireEvent.click(await screen.findByTestId("governance-quick-approve"));
    fireEvent.click(screen.getByTestId("governance-quick-approve-confirm"));

    expect(await screen.findByTestId("governance-quick-approve-inline-error")).toHaveTextContent(
      GOVERNANCE_QUICK_APPROVE_FAILURE_MESSAGE,
    );
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
