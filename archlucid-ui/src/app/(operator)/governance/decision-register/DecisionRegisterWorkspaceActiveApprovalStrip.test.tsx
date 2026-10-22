import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DecisionRegisterWorkspaceActiveApprovalStrip } from "./DecisionRegisterWorkspaceActiveApprovalStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "run-active-1", displayTitle: "Active review" }),
}));

describe("DecisionRegisterWorkspaceActiveApprovalStrip", () => {
  it("links to approval queue for workspace active review", () => {
    render(<DecisionRegisterWorkspaceActiveApprovalStrip />);

    expect(screen.getByTestId("decision-register-workspace-active-approval-strip")).toBeInTheDocument();
    expect(screen.getByTestId("decision-register-workspace-active-approval-action")).toHaveAttribute(
      "href",
      "/governance/approval-queue?runId=run-active-1",
    );
  });
});
