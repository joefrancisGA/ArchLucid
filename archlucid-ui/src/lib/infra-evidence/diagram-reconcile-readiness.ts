import type { DiagramReconcileSealedReviewRecordState } from "@/lib/infra-evidence/diagram-reconcile-sealed-review-record";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export type DiagramReconcileStepReadiness = {
  readonly label: string;
  readonly kind: EnterpriseStatusKind;
};

export function resolveDiagramReconcileDiagramSourceStepReadiness(input: {
  readonly sealedRecord: DiagramReconcileSealedReviewRecordState;
  readonly modelNodeCount: number | null;
  readonly loadingModel: boolean;
  readonly mermaidDraft: string;
}): DiagramReconcileStepReadiness {
  if (input.loadingModel) {
    return { label: "Loading model", kind: "in-progress" };
  }

  if (input.sealedRecord.kind === "loading") {
    return { label: "Verifying record", kind: "in-progress" };
  }

  if (
    input.sealedRecord.kind === "invalid-id"
    || input.sealedRecord.kind === "not-found"
    || input.sealedRecord.kind === "blocked"
    || (input.sealedRecord.kind === "loaded" && !input.sealedRecord.isSealed)
  ) {
    return { label: "Needs attention", kind: "needs-attention" };
  }

  if (input.modelNodeCount != null && input.modelNodeCount > 0) {
    return { label: "Model ready", kind: "ready" };
  }

  if (input.mermaidDraft.trim().length > 0) {
    return { label: "Draft ready to ingest", kind: "ready" };
  }

  if (input.sealedRecord.kind === "loaded") {
    return { label: "Needs diagram source", kind: "needs-attention" };
  }

  return { label: "Needs review record", kind: "needs-attention" };
}

export function resolveDiagramReconcileSnapshotStepReadiness(input: {
  readonly selectedSnapshotId: string;
  readonly loadingSnapshots: boolean;
  readonly snapshotCount: number;
}): DiagramReconcileStepReadiness {
  if (input.loadingSnapshots) {
    return { label: "Loading snapshots", kind: "in-progress" };
  }

  if (input.snapshotCount === 0) {
    return { label: "No snapshots", kind: "needs-attention" };
  }

  if (input.selectedSnapshotId.trim().length > 0) {
    return { label: "Snapshot selected", kind: "ready" };
  }

  return { label: "Needs snapshot", kind: "needs-attention" };
}

export function resolveDiagramReconcileReconcileStepReadiness(input: {
  readonly sealedRecord: DiagramReconcileSealedReviewRecordState;
  readonly selectedSnapshotId: string;
  readonly modelNodeCount: number | null;
  readonly reconciliationSaved: boolean;
  readonly loadingReconciliation: boolean;
}): DiagramReconcileStepReadiness {
  if (input.loadingReconciliation) {
    return { label: "Loading reconciliation", kind: "in-progress" };
  }

  if (input.reconciliationSaved) {
    return { label: "Reconciliation saved", kind: "ready" };
  }

  if (
    input.sealedRecord.kind === "loaded"
    && input.sealedRecord.isSealed
    && input.selectedSnapshotId.trim().length > 0
    && input.modelNodeCount != null
    && input.modelNodeCount > 0
  ) {
    return { label: "Ready to reconcile", kind: "ready" };
  }

  return { label: "Needs prerequisites", kind: "needs-attention" };
}

export function resolveDiagramReconcileBlockedReason(input: {
  readonly sealedRecord: DiagramReconcileSealedReviewRecordState;
  readonly selectedSnapshotId: string;
  readonly modelNodeCount: number | null;
}): string | null {
  if (input.sealedRecord.kind === "idle" || input.sealedRecord.kind === "invalid-id") {
    return "Needs a valid sealed review record ID.";
  }

  if (input.sealedRecord.kind === "loading") {
    return "Verifying sealed review record…";
  }

  if (input.sealedRecord.kind === "not-found") {
    return input.sealedRecord.message;
  }

  if (input.sealedRecord.kind === "blocked") {
    return input.sealedRecord.message;
  }

  if (input.sealedRecord.kind === "loaded" && !input.sealedRecord.isSealed) {
    return "Review record is not sealed — finalize the record before reconciling.";
  }

  if (input.selectedSnapshotId.trim().length === 0) {
    return "Needs an inventory snapshot.";
  }

  if (input.modelNodeCount == null || input.modelNodeCount <= 0) {
    return "Needs an ingested diagram model on this review record.";
  }

  return null;
}
