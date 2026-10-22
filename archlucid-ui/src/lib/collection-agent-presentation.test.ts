import { describe, expect, it } from "vitest";

import {
  formatCollectionRunDuration,
  formatCollectionRunSubscriptionsLabel,
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
    ).toBe("No successful run stored");

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
    expect(formatCollectionRunDuration(run({ finishedUtc: null, status: "Running" }))).toBe("In progress");
    expect(formatCollectionRunDuration(run({ finishedUtc: null, status: "Failed" }))).toBe(
      "Finish time was not stored.",
    );
    expect(
      formatCollectionRunDuration(
        run({ startedUtc: undefined, finishedUtc: "2026-08-10T12:05:00.000Z" }),
      ),
    ).toBe("Start time was not stored.");
    expect(
      formatCollectionRunDuration(
        run({ startedUtc: "not-a-date", finishedUtc: "2026-08-10T12:05:00.000Z" }),
      ),
    ).toBe("Duration was not stored.");
  });

  it("labels subscription coverage without collapsing missing, unreadable, and empty cases", () => {
    expect(formatCollectionRunSubscriptionsLabel(run({ subscriptionsCoveredJson: undefined }))).toBe(
      "Subscriptions covered were not stored.",
    );
    expect(formatCollectionRunSubscriptionsLabel(run({ subscriptionsCoveredJson: "not-json" }))).toBe(
      "Subscriptions covered could not be read.",
    );
    expect(formatCollectionRunSubscriptionsLabel(run({ subscriptionsCoveredJson: "[]" }))).toBe(
      "Subscriptions covered were stored as an empty list.",
    );
    expect(formatCollectionRunSubscriptionsLabel(run({ subscriptionsCoveredJson: '["sub-a"]' }))).toBe(
      "1 subscription covered.",
    );
    expect(
      formatCollectionRunSubscriptionsLabel(run({ subscriptionsCoveredJson: '["sub-a","sub-b","sub-c"]' })),
    ).toBe("3 subscriptions covered.");
  });
});
