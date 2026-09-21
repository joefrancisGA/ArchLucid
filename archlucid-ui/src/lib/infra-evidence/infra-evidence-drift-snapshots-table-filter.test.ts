import { describe, expect, it } from "vitest";

import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  filterDriftSnapshots,
  sortDriftSnapshots,
  toggleDriftSnapshotsTableSort,
} from "@/lib/infra-evidence/infra-evidence-drift-snapshots-table-filter";

function snapshot(overrides: Partial<InfraEvidenceSnapshotSummary> = {}): InfraEvidenceSnapshotSummary {
  return {
    snapshotId: "11111111-1111-1111-1111-111111111111",
    subscriptionId: "sub-1",
    subscriptionName: "Prod",
    capturedUtc: "2026-09-01T12:00:00Z",
    captureStatus: 1,
    resourceCount: 42,
    relationshipCount: 10,
    ...overrides,
  };
}

describe("infra-evidence-drift-snapshots-table-filter", () => {
  it("filters snapshots by subscription label", () => {
    const rows = [
      snapshot(),
      snapshot({ snapshotId: "22222222-2222-2222-2222-222222222222", subscriptionName: "Dev" }),
    ];

    expect(
      filterDriftSnapshots(rows, {
        subscriptionFilter: "dev",
        capturedFilter: "",
        resourcesFilter: "",
        relationshipsFilter: "",
      }),
    ).toHaveLength(1);
  });

  it("sorts snapshots by resource count descending", () => {
    const rows = [
      snapshot({ resourceCount: 10 }),
      snapshot({ snapshotId: "22222222-2222-2222-2222-222222222222", resourceCount: 99 }),
    ];

    const sorted = sortDriftSnapshots(rows, "resources", "desc");

    expect(sorted[0]?.resourceCount).toBe(99);
  });

  it("toggles snapshot sort direction on the same column", () => {
    const next = toggleDriftSnapshotsTableSort(
      {
        subscriptionFilter: "",
        capturedFilter: "",
        resourcesFilter: "",
        relationshipsFilter: "",
        sortBy: "captured",
        sortDir: "desc",
      },
      "captured",
    );

    expect(next.sortDir).toBe("asc");
  });
});
