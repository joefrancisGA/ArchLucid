import { describe, expect, it } from "vitest";

import {
  diagramReconcileFilterHrefFromSearch,
  parseDiagramReconcileFilterFromSearch,
  parseDiagramReconcileRunIdFromSearch,
  parseDiagramReconcileSnapshotIdFromSearch,
} from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-filter-url";

describe("infra-evidence-diagram-reconcile-filter-url", () => {
  it("parses run, snapshot, and filter params", () => {
    expect(parseDiagramReconcileRunIdFromSearch("run-1")).toBe("run-1");
    expect(parseDiagramReconcileSnapshotIdFromSearch("snap-1")).toBe("snap-1");
    expect(parseDiagramReconcileFilterFromSearch(null)).toBe("all");
    expect(parseDiagramReconcileFilterFromSearch("Conflict")).toBe("Conflict");
    expect(parseDiagramReconcileFilterFromSearch("bogus")).toBe("all");
  });

  it("round-trips filter href patches", () => {
    expect(
      diagramReconcileFilterHrefFromSearch("", {
        runId: "run-1",
        snapshotId: "snap-1",
        reconcileFilter: "Conflict",
      }),
    ).toBe("/governance/infrastructure/diagram-reconcile?runId=run-1&snapshotId=snap-1&reconcileFilter=Conflict");

    expect(
      diagramReconcileFilterHrefFromSearch(
        "runId=run-1&snapshotId=snap-1&reconcileFilter=Conflict",
        { reconcileFilter: "all" },
      ),
    ).toBe("/governance/infrastructure/diagram-reconcile?runId=run-1&snapshotId=snap-1");
  });
});
