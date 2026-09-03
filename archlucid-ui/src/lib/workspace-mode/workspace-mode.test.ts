import { describe, expect, it } from "vitest";

import {
  DEFAULT_WORKSPACE_MODE,
  isGuidedWorkspaceMode,
  isWorkingWorkspaceMode,
  parseWorkspaceMode,
} from "@/lib/workspace-mode/workspace-mode";

describe("workspace-mode", () => {
  it("defaults to working", () => {
    expect(DEFAULT_WORKSPACE_MODE).toBe("working");
    expect(parseWorkspaceMode(null)).toBe("working");
    expect(parseWorkspaceMode(undefined)).toBe("working");
    expect(parseWorkspaceMode("bogus")).toBe("working");
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
