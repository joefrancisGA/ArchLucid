import { describe, expect, it } from "vitest";

import { isWorkspaceHealthPath, WORKSPACE_HEALTH_PATH } from "@/lib/workspace-health-route";

describe("isWorkspaceHealthPath", () => {
  it("matches the canonical workspace health path", () => {
    expect(isWorkspaceHealthPath(WORKSPACE_HEALTH_PATH)).toBe(true);
  });

  it("matches nested workspace health routes", () => {
    expect(isWorkspaceHealthPath(`${WORKSPACE_HEALTH_PATH}/details`)).toBe(true);
  });

  it("rejects lookalike paths", () => {
    expect(isWorkspaceHealthPath("/insights/workspace-healthish")).toBe(false);
    expect(isWorkspaceHealthPath("/insights/workspace-health-extra")).toBe(false);
    expect(isWorkspaceHealthPath("/governance/dashboard")).toBe(false);
  });
});
