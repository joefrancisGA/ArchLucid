import { describe, expect, it } from "vitest";

import { resolveNextRunsListRow } from "@/lib/resolve-next-runs-list-row";
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

describe("resolveNextRunsListRow", () => {
  it("returns the next run in createdUtc order", () => {
    const next = resolveNextRunsListRow(
      [
        run({ runId: "run-new", createdUtc: "2026-02-01T00:00:00Z", title: "New review" }),
        run({ runId: "run-old", createdUtc: "2025-01-01T00:00:00Z", title: "Old review" }),
      ],
      "run-new",
    );

    expect(next?.runId).toBe("run-old");
  });
});
