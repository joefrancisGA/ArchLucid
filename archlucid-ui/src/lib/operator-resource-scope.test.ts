import { describe, expect, it } from "vitest";

import {
  normalizeProjectId,
  projectIdFromScopeHeaders,
  runProjectMatchesEffectiveScope,
} from "./operator-resource-scope";

describe("operator-resource-scope", () => {
  it("normalizeProjectId trims and lowercases", () => {
    expect(normalizeProjectId("  ABC-123  ")).toBe("abc-123");
    expect(normalizeProjectId(undefined)).toBe("");
  });

  it("runProjectMatchesEffectiveScope returns true when either side is empty", () => {
    expect(runProjectMatchesEffectiveScope("", "proj-a")).toBe(true);
    expect(runProjectMatchesEffectiveScope("proj-a", "")).toBe(true);
  });

  it("runProjectMatchesEffectiveScope compares case-insensitively", () => {
    expect(runProjectMatchesEffectiveScope("Proj-A", "proj-a")).toBe(true);
    expect(runProjectMatchesEffectiveScope("proj-a", "proj-b")).toBe(false);
  });

  it("projectIdFromScopeHeaders reads x-project-id", () => {
    expect(projectIdFromScopeHeaders({ "x-project-id": "  tenant-proj  " })).toBe("tenant-proj");
    expect(projectIdFromScopeHeaders({})).toBeUndefined();
  });
});
