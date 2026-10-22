import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApprovalQueueTriageFirstPendingStrip } from "./ApprovalQueueTriageFirstPendingStrip";

describe("ApprovalQueueTriageFirstPendingStrip", () => {
  it("calls review decision handler", () => {
    const onReviewDecision = vi.fn();

    render(
      <ApprovalQueueTriageFirstPendingStrip
        target={{
          approvalRequestId: "req-1",
          runId: "run-1",
          manifestVersion: "v1",
          sourceEnvironment: "dev",
          targetEnvironment: "prod",
          requestedUtc: "2026-01-01T00:00:00Z",
        }}
        onReviewDecision={onReviewDecision}
      />,
    );

    fireEvent.click(screen.getByTestId("approval-queue-triage-first-pending-review"));
    expect(onReviewDecision).toHaveBeenCalledWith("req-1");
  });
});
