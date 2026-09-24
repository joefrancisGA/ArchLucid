import { describe, expect, it } from "vitest";

import {
  resolveDiagramReconcileBlockedReason,
  resolveDiagramReconcileReconcileStepReadiness,
} from "@/lib/infra-evidence/diagram-reconcile-readiness";

const SEALED_RECORD = {
  kind: "loaded" as const,
  reviewTitle: "Claims intake modernization",
  sealStatusLabel: "Sealed",
  sealStatusKind: "ready" as const,
  sealDateLabel: "Jan 2, 2026",
  runId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  isSealed: true,
};

describe("diagram-reconcile-readiness", () => {
  it("explains reconcile prerequisites when the snapshot is missing", () => {
    expect(
      resolveDiagramReconcileBlockedReason({
        sealedRecord: SEALED_RECORD,
        selectedSnapshotId: "",
        modelNodeCount: 3,
      }),
    ).toBe("Needs an inventory snapshot.");
  });

  it("marks reconcile ready when prerequisites are satisfied", () => {
    expect(
      resolveDiagramReconcileReconcileStepReadiness({
        sealedRecord: SEALED_RECORD,
        selectedSnapshotId: "11111111-1111-1111-1111-111111111111",
        modelNodeCount: 3,
        reconciliationSaved: false,
        loadingReconciliation: false,
      }).label,
    ).toBe("Ready to reconcile");
  });
});
