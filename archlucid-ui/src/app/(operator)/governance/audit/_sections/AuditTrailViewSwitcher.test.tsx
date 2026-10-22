import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  AUDIT_TRAIL_VIEW_STORY_LABEL,
  AUDIT_TRAIL_VIEW_SWITCHER_GROUP_LABEL,
  AUDIT_TRAIL_VIEW_TABLE_LABEL,
} from "@/lib/audit-trail-view-mode";
import { AuditTrailViewSwitcher } from "./AuditTrailViewSwitcher";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

describe("AuditTrailViewSwitcher", () => {
  it("exposes URL-bound view chips with aria-current on the active view", () => {
    render(<AuditTrailViewSwitcher viewMode="story" currentSearch="runId=abc" />);

    const group = screen.getByRole("group", { name: AUDIT_TRAIL_VIEW_SWITCHER_GROUP_LABEL });
    expect(group).toBeInTheDocument();

    const storyLink = screen.getByRole("link", { name: AUDIT_TRAIL_VIEW_STORY_LABEL });
    const tableLink = screen.getByRole("link", { name: AUDIT_TRAIL_VIEW_TABLE_LABEL });

    expect(storyLink).toHaveAttribute("aria-current", "page");
    expect(tableLink).not.toHaveAttribute("aria-current");
    expect(storyLink).toHaveAttribute("href", "/governance/audit?runId=abc&view=story");
    expect(tableLink).toHaveAttribute("href", "/governance/audit?runId=abc");
  });
});
