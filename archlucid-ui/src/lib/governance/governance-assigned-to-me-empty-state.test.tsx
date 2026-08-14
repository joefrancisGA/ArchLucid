import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  buildGovernanceAssignedToMeEmptyDescription,
  formatGovernanceAssignedToMeCheckedAt,
  resolveGovernanceAssignedToMeAssigneeLabel,
  resolveGovernanceAssignedToMeWorkspaceLabel,
} from "@/lib/governance/governance-assigned-to-me-empty-state";

describe("governance-assigned-to-me-empty-state", () => {
  it("formats checked-at timestamps as HH:mm", () => {
    expect(formatGovernanceAssignedToMeCheckedAt(new Date("2026-08-14T18:05:00.000Z"))).toMatch(/^Checked \d{2}:\d{2}$/);
  });

  it("names assignee, workspace, and freshness in the empty description", () => {
    render(
      <>
        {buildGovernanceAssignedToMeEmptyDescription({
          assigneeDisplayName: "Jordan Lee",
          workspaceName: "Claims Intake Demo",
          checkedAt: new Date("2026-08-14T18:05:00.000Z"),
        })}
      </>,
    );

    expect(screen.getByText(/Jordan Lee/)).toBeInTheDocument();
    expect(screen.getByText(/Claims Intake Demo/)).toBeInTheDocument();
    expect(screen.getByTestId("governance-assigned-to-me-empty-checked-at")).toHaveTextContent(/^Checked \d{2}:\d{2}$/);
  });

  it("falls back to neutral labels when identity fields are missing", () => {
    expect(resolveGovernanceAssignedToMeAssigneeLabel(null)).toBe("you");
    expect(resolveGovernanceAssignedToMeWorkspaceLabel("", "ws-123")).toBe("ws-123");
  });
});
