import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  AUDIT_TRAIL_VIEW_STORY_LABEL,
  AUDIT_TRAIL_VIEW_SWITCHER_GROUP_LABEL,
  AUDIT_TRAIL_VIEW_TABLE_LABEL,
} from "@/lib/audit-trail-view-mode";

import { AuditTrailViewSwitcher } from "./AuditTrailViewSwitcher";

describe("AuditTrailViewSwitcher", () => {
  it("exposes segmented-control semantics with aria-pressed on the active view", () => {
    const onViewModeChange = vi.fn();

    render(<AuditTrailViewSwitcher viewMode="story" onViewModeChange={onViewModeChange} />);

    const group = screen.getByRole("group", { name: AUDIT_TRAIL_VIEW_SWITCHER_GROUP_LABEL });
    expect(group).toBeInTheDocument();
    expect(group).not.toHaveAttribute("role", "tablist");

    const storyButton = screen.getByRole("button", { name: AUDIT_TRAIL_VIEW_STORY_LABEL });
    const tableButton = screen.getByRole("button", { name: AUDIT_TRAIL_VIEW_TABLE_LABEL });

    expect(storyButton).toHaveAttribute("aria-pressed", "true");
    expect(storyButton).not.toHaveAttribute("role", "tab");
    expect(tableButton).toHaveAttribute("aria-pressed", "false");
    expect(tableButton).not.toHaveAttribute("role", "tab");
  });

  it("calls onViewModeChange when table is selected", () => {
    const onViewModeChange = vi.fn();

    render(<AuditTrailViewSwitcher viewMode="story" onViewModeChange={onViewModeChange} />);

    fireEvent.click(screen.getByRole("button", { name: AUDIT_TRAIL_VIEW_TABLE_LABEL }));

    expect(onViewModeChange).toHaveBeenCalledWith("table");
  });

  it("calls onViewModeChange when story is selected", () => {
    const onViewModeChange = vi.fn();

    render(<AuditTrailViewSwitcher viewMode="table" onViewModeChange={onViewModeChange} />);

    fireEvent.click(screen.getByRole("button", { name: AUDIT_TRAIL_VIEW_STORY_LABEL }));

    expect(onViewModeChange).toHaveBeenCalledWith("story");
  });
});
