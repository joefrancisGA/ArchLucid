import { describe, expect, it } from "vitest";

import {
  buildWorkingArchitectureSearchRunIdSet,
  isWorkingArchitectureSearchPath,
  resolveWorkingSearchArchitectureIdFromPath,
  resolveWorkingSearchArchitectureScopeFromUrl,
} from "@/lib/search/working-architecture-search-scope";

describe("working architecture search scope (AO-32)", () => {
  it("AO-32: treats architecture desk and nested job routes as architecture-search paths", () => {
    expect(isWorkingArchitectureSearchPath("/architecture/architectures/architecture-identity-001")).toBe(true);
    expect(
      isWorkingArchitectureSearchPath(
        "/architecture/architectures/architecture-identity-001/reviews/review-1",
      ),
    ).toBe(true);
    expect(isWorkingArchitectureSearchPath("/architecture/reviews/review-1")).toBe(false);
  });

  it("AO-32: resolves architecture id from nested routes", () => {
    expect(
      resolveWorkingSearchArchitectureIdFromPath(
        "/architecture/architectures/architecture-identity-001/drafts/draft-1",
      ),
    ).toBe("architecture-identity-001");
  });

  it("AO-32: defaults to cached architecture id until workspace scope is explicit", () => {
    expect(
      resolveWorkingSearchArchitectureScopeFromUrl(null, "architecture-identity-001"),
    ).toEqual({
      architectureId: "architecture-identity-001",
      explicit: false,
    });
    expect(
      resolveWorkingSearchArchitectureScopeFromUrl("all", "architecture-identity-001"),
    ).toEqual({
      architectureId: null,
      explicit: true,
    });
  });

  it("AO-32: builds a sibling run id set for scoped filtering", () => {
    const runIds = buildWorkingArchitectureSearchRunIdSet([
      { runId: "review-1", createdUtc: "2026-01-01T00:00:00Z" },
      { runId: "review-2", createdUtc: "2026-01-02T00:00:00Z" },
    ]);

    expect(runIds.has("review-1")).toBe(true);
    expect(runIds.has("review-2")).toBe(true);
    expect(runIds.has("review-other")).toBe(false);
  });
});
