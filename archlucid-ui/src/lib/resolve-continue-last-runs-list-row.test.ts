import { describe, expect, it } from "vitest";

import { resolveContinueLastRunsListRow } from "@/lib/resolve-continue-last-runs-list-row";
import type { RunSummary } from "@/types/authority";

function run(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    runId: "run-1",
    projectId: "project-1",
    title: "Platform review",
    createdUtc: "2026-01-01T00:00:00Z",
    status: "Committed",
    hasGoldenManifest: true,
    ...overrides,
  } as RunSummary;
}

describe("resolveContinueLastRunsListRow", () => {
  it("prefers the most recently created run when no recent view exists", () => {
    const match = resolveContinueLastRunsListRow([
      run({ runId: "run-old", createdUtc: "2025-01-01T00:00:00Z" }),
      run({ runId: "run-new", createdUtc: "2026-02-01T00:00:00Z" }),
    ]);

    expect(match?.runId).toBe("run-new");
  });
});
