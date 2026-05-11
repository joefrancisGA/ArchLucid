import { describe, expect, it } from "vitest";

import type { RunSummary } from "@/types/authority";

import { findPriorCommittedRun, runSummaryMatchesRunId } from "./find-prior-committed-run";

describe("findPriorCommittedRun", () => {
  it("returns the next older committed run after the current row", () => {
    const runs: RunSummary[] = [
      {
        runId: "run-new",
        projectId: "p",
        createdUtc: "2026-05-11T12:00:00Z",
        hasGoldenManifest: true,
      },
      {
        runId: "run-old",
        projectId: "p",
        createdUtc: "2026-05-10T12:00:00Z",
        hasGoldenManifest: true,
      },
    ];

    expect(findPriorCommittedRun("run-new", runs)?.runId).toBe("run-old");
  });

  it("skips older rows that are not committed", () => {
    const runs: RunSummary[] = [
      {
        runId: "c",
        projectId: "p",
        createdUtc: "2026-05-11T12:00:00Z",
        hasGoldenManifest: true,
      },
      {
        runId: "b",
        projectId: "p",
        createdUtc: "2026-05-10T12:00:00Z",
        hasGoldenManifest: false,
      },
      {
        runId: "a",
        projectId: "p",
        createdUtc: "2026-05-09T12:00:00Z",
        hasGoldenManifest: true,
      },
    ];

    expect(findPriorCommittedRun("c", runs)?.runId).toBe("a");
  });

  it("returns null when no prior committed run exists", () => {
    const runs: RunSummary[] = [
      {
        runId: "only",
        projectId: "p",
        createdUtc: "2026-05-11T12:00:00Z",
        hasGoldenManifest: true,
      },
    ];

    expect(findPriorCommittedRun("only", runs)).toBeNull();
  });

  it("matches run ids case-insensitively", () => {
    expect(runSummaryMatchesRunId({ runId: "AbC", projectId: "p", createdUtc: "2026-01-01T00:00:00Z" }, "abc")).toBe(
      true,
    );
  });
});
