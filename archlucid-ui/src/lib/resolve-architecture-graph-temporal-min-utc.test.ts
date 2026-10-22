import { describe, expect, it } from "vitest";

import type { RunSummary } from "@/types/authority";

import { resolveArchitectureGraphTemporalMinUtc } from "./resolve-architecture-graph-temporal-min-utc";

function runSummary(partial: Partial<RunSummary> & Pick<RunSummary, "runId" | "createdUtc">): RunSummary {
  return {
    projectId: "default",
    hasGoldenManifest: false,
    ...partial,
  };
}

describe("resolveArchitectureGraphTemporalMinUtc", () => {
  it("uses the earliest graph snapshot at or before the active review", () => {
    const anchor = "2026-06-10T12:00:00Z";
    const runs: RunSummary[] = [
      runSummary({
        runId: "newer-graph",
        createdUtc: "2026-06-15T12:00:00Z",
        hasGraphSnapshot: true,
      }),
      runSummary({
        runId: "mid-graph",
        createdUtc: "2026-06-05T12:00:00Z",
        hasGraphSnapshot: true,
      }),
      runSummary({
        runId: "older-graph",
        createdUtc: "2026-06-01T12:00:00Z",
        hasGraphSnapshot: true,
      }),
    ];

    expect(resolveArchitectureGraphTemporalMinUtc(anchor, runs)).toBe("2026-06-01T12:00:00Z");
  });

  it("does not pull graph history forward when the active review is older than the recent window", () => {
    const anchor = "2026-01-01T00:00:00Z";
    const runs: RunSummary[] = Array.from({ length: 60 }, (_, index) =>
      runSummary({
        runId: `run-${index}`,
        createdUtc: `2026-06-${String(index + 5).padStart(2, "0")}T00:00:00Z`,
        hasGraphSnapshot: true,
      }),
    );

    expect(resolveArchitectureGraphTemporalMinUtc(anchor, runs)).toBe(anchor);
  });

  it("falls back to the anchor when no eligible graph snapshots exist", () => {
    const anchor = "2026-05-01T12:00:00Z";
    const runs: RunSummary[] = [
      runSummary({
        runId: "no-graph",
        createdUtc: "2026-04-01T12:00:00Z",
        hasGraphSnapshot: false,
      }),
      runSummary({
        runId: "future-graph",
        createdUtc: "2026-06-01T12:00:00Z",
        hasGraphSnapshot: true,
      }),
    ];

    expect(resolveArchitectureGraphTemporalMinUtc(anchor, runs)).toBe(anchor);
  });
});
