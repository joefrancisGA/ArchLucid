import { describe, expect, it } from "vitest";

import {
  formatCollectionRunDuration,
  resolveCollectionAgentHealth,
} from "@/lib/collection-agent-presentation";
import type { CollectionRun } from "@/lib/collection-runs-api";

function run(overrides: Partial<CollectionRun> = {}): CollectionRun {
  return {
    agentVersion: "1.0.0",
    errorSummary: null,
    finishedUtc: "2026-10-11T22:00:00.000Z",
    importedSnapshotId: null,
    projectId: "project",
    runId: "run",
    startedUtc: "2026-10-11T21:55:00.000Z",
    status: "Succeeded",
    subscriptionsCoveredJson: "[]",
    tenantId: "tenant",
    workspaceId: "workspace",
    zipPath: null,
    zipSha256: null,
    ...overrides,
  };
}

describe("collection-agent-presentation", () => {
  it("is ready when a successful run is inside the expected interval", () => {
    const health = resolveCollectionAgentHealth(
      [run()],
      Date.parse("2026-10-12T10:00:00.000Z"),
    );

    expect(health.label).toBe("Ready");
    expect(health.successfulRun?.runId).toBe("run");
  });

  it("blocks without a success and needs attention after a failed or stale run", () => {
    expect(
      resolveCollectionAgentHealth(
        [run({ status: "Failed", errorSummary: "Reader denied" })],
        Date.parse("2026-10-11T23:00:00.000Z"),
      ).label,
    ).toBe("Blocked");

    expect(
      resolveCollectionAgentHealth(
        [run(), run({
          runId: "failed",
          startedUtc: "2026-10-11T23:00:00.000Z",
          finishedUtc: "2026-10-11T23:01:00.000Z",
          status: "Failed",
          errorSummary: "Reader denied",
        })],
        Date.parse("2026-10-12T00:00:00.000Z"),
      ).label,
    ).toBe("Needs attention");

    expect(
      resolveCollectionAgentHealth(
        [run()],
        Date.parse("2026-10-13T00:01:00.000Z"),
      ).label,
    ).toBe("Needs attention");
  });

  it("formats completed and in-progress durations", () => {
    expect(formatCollectionRunDuration(run())).toBe("5m 0s");
    expect(formatCollectionRunDuration(run({ finishedUtc: null }))).toBe("In progress");
  });
});
