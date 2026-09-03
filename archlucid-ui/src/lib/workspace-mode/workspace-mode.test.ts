import { describe, expect, it } from "vitest";

import {
  DEFAULT_WORKSPACE_MODE,
  isGuidedWorkspaceMode,
  isWorkingWorkspaceMode,
  parseWorkspaceMode,
} from "@/lib/workspace-mode/workspace-mode";

describe("workspace-mode", () => {
  it("defaults to guided", () => {
    expect(DEFAULT_WORKSPACE_MODE).toBe("guided");
    expect(parseWorkspaceMode(null)).toBe("guided");
    expect(parseWorkspaceMode(undefined)).toBe("guided");
    expect(parseWorkspaceMode("bogus")).toBe("guided");
  });

  it("parses working case-insensitively", () => {
    expect(parseWorkspaceMode("WORKING")).toBe("working");
  });

  it("classifies modes", () => {
    expect(isGuidedWorkspaceMode("guided")).toBe(true);
    expect(isWorkingWorkspaceMode("working")).toBe(true);
    expect(isWorkingWorkspaceMode("guided")).toBe(false);
  });
});
