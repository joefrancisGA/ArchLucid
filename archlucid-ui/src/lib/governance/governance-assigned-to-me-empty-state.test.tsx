import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  buildGovernanceAssignedToMeEmptyDescription,
  formatGovernanceAssignedToMeCheckedAtRelative,
  resolveGovernanceAssignedToMeAssigneeLabel,
  resolveGovernanceAssignedToMeWorkspaceLabel,
} from "@/lib/governance/governance-assigned-to-me-empty-state";
import * as operatorScopeStorage from "@/lib/operator/operator-scope-storage";

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

describe("governance-assigned-to-me-empty-state", () => {
  it("formats checked-at timestamps as relative age", () => {
    const checkedAt = new Date("2026-08-14T18:03:00.000Z");
    const nowMs = new Date("2026-08-14T18:05:00.000Z").getTime();

    expect(formatGovernanceAssignedToMeCheckedAtRelative(checkedAt, nowMs)).toBe("2 minutes ago");
  });

  it("names assignee, workspace, and freshness in the empty description", () => {
    render(
      <>
        {buildGovernanceAssignedToMeEmptyDescription(
          {
            assigneeDisplayName: "Jordan Lee",
            checkedAt: new Date("2026-08-14T18:03:00.000Z"),
          },
          { nowMs: new Date("2026-08-14T18:05:00.000Z").getTime() },
        )}
      </>,
    );

    expect(screen.getByText(/Jordan Lee/)).toBeInTheDocument();
    expect(screen.getByText(/Claims Intake Demo/)).toBeInTheDocument();

    const checkedAt = screen.getByTestId("governance-assigned-to-me-empty-checked-at");
    expect(checkedAt).toHaveTextContent("Checked 2 minutes ago");
    expect(checkedAt.querySelector("time")).toHaveAttribute("dateTime", "2026-08-14T18:03:00.000Z");
    expect(checkedAt.querySelector("time")).toHaveAttribute("title");
  });

  it("falls back to neutral labels when identity fields are missing", () => {
    expect(resolveGovernanceAssignedToMeAssigneeLabel(null)).toBe("you");
    expect(resolveGovernanceAssignedToMeWorkspaceLabel()).toBe("Claims Intake Demo");
  });

  it("does not leak raw workspace ids when localStorage is empty under dev-default scope", () => {
    vi.spyOn(operatorScopeStorage, "readOperatorScopeFromStorage").mockReturnValue(null);

    render(
      <>
        {buildGovernanceAssignedToMeEmptyDescription({
          assigneeDisplayName: "Jordan Lee",
          checkedAt: new Date("2026-08-14T18:05:00.000Z"),
        })}
      </>,
    );

    const workspaceLine = screen.getByText(/No open findings are assigned to/);
    const checkedAt = screen.getByTestId("governance-assigned-to-me-empty-checked-at");

    expect(workspaceLine.textContent ?? "").not.toMatch(UUID_PATTERN);
    expect(checkedAt.textContent ?? "").not.toMatch(UUID_PATTERN);
    expect(screen.getByText(/Claims Intake Demo/)).toBeInTheDocument();
  });
});
