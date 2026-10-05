import { describe, expect, it } from "vitest";

import {
  resolveDiagramReconcileBlockedReason,
  resolveDiagramReconcileBlockedReasonDetail,
  resolveDiagramReconcileReconcileStepReadiness,
  resolveDiagramReconcileSnapshotStepReadiness,
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
        workbenchMode: "sealed",
        sealedRecord: SEALED_RECORD,
        selectedSnapshotId: "",
        modelNodeCount: 3,
        mermaidDraft: "",
      }),
    ).toBe("Select an inventory snapshot in step 2.");
  });

  it("marks reconcile ready when prerequisites are satisfied", () => {
    expect(
      resolveDiagramReconcileReconcileStepReadiness({
        workbenchMode: "sealed",
        sealedRecord: SEALED_RECORD,
        selectedSnapshotId: "11111111-1111-1111-1111-111111111111",
        modelNodeCount: 3,
        mermaidDraft: "",
        reconciliationSaved: false,
        loadingReconciliation: false,
      }).label,
    ).toBe("Ready to reconcile");
  });

  it("blocks advisory compare when only ingested model count is present without mermaid", () => {
    expect(
      resolveDiagramReconcileBlockedReasonDetail({
        workbenchMode: "advisory",
        sealedRecord: { kind: "idle" },
        selectedSnapshotId: "11111111-1111-1111-1111-111111111111",
        modelNodeCount: 12,
        mermaidDraft: "",
      })?.message,
    ).toBe("Add a Mermaid diagram draft in step 1.");
  });

  it("allows advisory compare when sealed review id is blank and a mermaid draft exists", () => {
    expect(
      resolveDiagramReconcileBlockedReason({
        workbenchMode: "advisory",
        sealedRecord: { kind: "idle" },
        selectedSnapshotId: "11111111-1111-1111-1111-111111111111",
        modelNodeCount: null,
        mermaidDraft: "flowchart LR\n  a --> b",
      }),
    ).toBeNull();

    expect(
      resolveDiagramReconcileReconcileStepReadiness({
        workbenchMode: "advisory",
        sealedRecord: { kind: "idle" },
        selectedSnapshotId: "11111111-1111-1111-1111-111111111111",
        modelNodeCount: null,
        mermaidDraft: "flowchart LR\n  a --> b",
        reconciliationSaved: false,
        loadingReconciliation: false,
      }).label,
    ).toBe("Ready to compare");
  });

  it("treats invalid sealed ids as blocked in sealed mode", () => {
    expect(
      resolveDiagramReconcileBlockedReasonDetail({
        workbenchMode: "sealed",
        sealedRecord: { kind: "invalid-id" },
        selectedSnapshotId: "11111111-1111-1111-1111-111111111111",
        modelNodeCount: null,
        mermaidDraft: "",
      })?.message,
    ).toBe("Enter a valid sealed review record ID in step 1.");
  });

  it("keeps snapshot selected during refresh when the id is already known", () => {
    expect(
      resolveDiagramReconcileSnapshotStepReadiness({
        selectedSnapshotId: "11111111-1111-1111-1111-111111111111",
        loadingSnapshots: true,
        snapshotCount: 2,
        knownSnapshotIds: ["11111111-1111-1111-1111-111111111111"],
      }).label,
    ).toBe("Snapshot selected");
  });
});
