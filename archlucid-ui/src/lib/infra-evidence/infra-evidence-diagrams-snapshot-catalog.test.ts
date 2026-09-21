import { describe, expect, it } from "vitest";

import {
  buildInfraDiagramsSubscriptionFilterOptions,
  filterInfraDiagramsSnapshotsBySubscription,
  INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_ALL,
  sortInfraDiagramsSnapshotsForPicker,
} from "@/lib/infra-evidence/infra-evidence-diagrams-snapshot-catalog";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";

function snapshot(overrides: Partial<InfraEvidenceSnapshotSummary> = {}): InfraEvidenceSnapshotSummary {
  return {
    snapshotId: "11111111-1111-1111-1111-111111111111",
    subscriptionId: "sub-prod",
    subscriptionName: "Prod",
    capturedUtc: "2026-09-01T12:00:00Z",
    captureStatus: 1,
    resourceCount: 10,
    relationshipCount: 2,
    ...overrides,
  };
}

describe("infra-evidence-diagrams-snapshot-catalog", () => {
  it("sorts by architecture name descending then capture time descending", () => {
    const sorted = sortInfraDiagramsSnapshotsForPicker([
      snapshot({
        snapshotId: "11111111-1111-1111-1111-111111111111",
        architectureName: "Alpha",
        capturedUtc: "2026-09-01T12:00:00Z",
      }),
      snapshot({
        snapshotId: "22222222-2222-2222-2222-222222222222",
        architectureName: "Zulu",
        capturedUtc: "2026-08-01T12:00:00Z",
      }),
      snapshot({
        snapshotId: "33333333-3333-3333-3333-333333333333",
        architectureName: "Zulu",
        capturedUtc: "2026-09-10T12:00:00Z",
      }),
    ]);

    expect(sorted.map((row) => row.snapshotId)).toEqual([
      "33333333-3333-3333-3333-333333333333",
      "22222222-2222-2222-2222-222222222222",
      "11111111-1111-1111-1111-111111111111",
    ]);
  });

  it("builds subscription filter options without an All row", () => {
    const options = buildInfraDiagramsSubscriptionFilterOptions([
      snapshot({ subscriptionId: "sub-dev", subscriptionName: "Dev" }),
      snapshot({
        snapshotId: "22222222-2222-2222-2222-222222222222",
        subscriptionId: "sub-prod",
        subscriptionName: "Prod",
      }),
    ]);

    expect(options.map((option) => option.label)).toEqual(["Dev", "Prod"]);
  });

  it("filters snapshots by subscription id", () => {
    const rows = [
      snapshot({ subscriptionId: "sub-prod" }),
      snapshot({
        snapshotId: "22222222-2222-2222-2222-222222222222",
        subscriptionId: "sub-dev",
        subscriptionName: "Dev",
      }),
    ];

    expect(filterInfraDiagramsSnapshotsBySubscription(rows, INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_ALL)).toHaveLength(2);
    expect(filterInfraDiagramsSnapshotsBySubscription(rows, "")).toHaveLength(0);
    expect(filterInfraDiagramsSnapshotsBySubscription(rows, "sub-dev")).toHaveLength(1);
    expect(filterInfraDiagramsSnapshotsBySubscription(rows, "sub-dev")[0]?.snapshotId).toBe(
      "22222222-2222-2222-2222-222222222222",
    );
  });
});
