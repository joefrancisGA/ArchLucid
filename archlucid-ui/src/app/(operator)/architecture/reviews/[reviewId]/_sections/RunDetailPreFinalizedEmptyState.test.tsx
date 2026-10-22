import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/use-core-pilot-derived-step-status", () => ({
  useCorePilotDerivedStepStatus: () => ({ isPending: false, nextStepIndex: null }),
}));

import { RunDetailPreFinalizedEmptyState } from "./RunDetailPreFinalizedEmptyState";

describe("RunDetailPreFinalizedEmptyState", () => {
  it("does not promise completion when the review already failed", () => {
    render(<RunDetailPreFinalizedEmptyState runId="run-1" terminalFailure />);

    expect(screen.getByText("Review did not finalize")).toBeInTheDocument();
    expect(screen.queryByText("Review not ready yet")).not.toBeInTheDocument();
    expect(screen.getByText(/stopped before a sealed review record/)).toBeInTheDocument();
    expect(screen.queryByText(/will appear here/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "See audit trail / findings" })).not.toBeInTheDocument();
  });

  it("keeps pending copy when the review has not failed", () => {
    render(<RunDetailPreFinalizedEmptyState runId="run-1" />);

    expect(screen.getByText("Review not ready yet")).toBeInTheDocument();
    expect(screen.getByText(/has not been finalized yet/)).toBeInTheDocument();
  });
});
