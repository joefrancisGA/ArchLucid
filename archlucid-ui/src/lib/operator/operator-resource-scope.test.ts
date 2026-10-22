import { describe, expect, it } from "vitest";

import {
  normalizeProjectId,
  projectIdFromScopeHeaders,
  runProjectMatchesEffectiveScope,
} from "@/lib/operator/operator-resource-scope";

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

  it("run scope GUID match passes when ingestion slug differs (load-run-detail-page-model)", () => {
    const scopeGuid = "33333333-3333-3333-3333-333333333333";

    expect(runProjectMatchesEffectiveScope(scopeGuid, scopeGuid)).toBe(true);
    expect(runProjectMatchesEffectiveScope("default", scopeGuid)).toBe(false);
  });

  it("run scope GUID mismatch still fails IDOR ownership check", () => {
    expect(
      runProjectMatchesEffectiveScope(
        "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        "33333333-3333-3333-3333-333333333333",
      ),
    ).toBe(false);
  });

  it("projectIdFromScopeHeaders reads x-project-id", () => {
    expect(projectIdFromScopeHeaders({ "x-project-id": "  tenant-proj  " })).toBe("tenant-proj");
    expect(projectIdFromScopeHeaders({})).toBeUndefined();
  });
});
