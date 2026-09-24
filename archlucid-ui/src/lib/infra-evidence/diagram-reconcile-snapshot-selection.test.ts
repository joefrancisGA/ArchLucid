import { describe, expect, it } from "vitest";

import { resolveDiagramReconcileSnapshotSelectionSummary } from "@/lib/infra-evidence/diagram-reconcile-snapshot-selection";

describe("diagram-reconcile-snapshot-selection", () => {
  it("marks the first snapshot as auto-selected when the URL omitted snapshotId", () => {
    const summary = resolveDiagramReconcileSnapshotSelectionSummary({
      snapshots: [
        {
          snapshotId: "11111111-1111-1111-1111-111111111111",
          subscriptionId: "sub-1",
          subscriptionName: "Prod",
          capturedUtc: "2026-09-01T12:00:00Z",
          captureStatus: 1,
          resourceCount: 12,
          relationshipCount: 4,
        },
      ],
      selectedSnapshotId: "11111111-1111-1111-1111-111111111111",
      urlSnapshotId: "",
      nowMs: Date.parse("2026-09-06T12:00:00Z"),
    });

    expect(summary?.selectionMarker).toBe("Auto-selected");
    expect(summary?.stale).toBe(false);
  });
});
