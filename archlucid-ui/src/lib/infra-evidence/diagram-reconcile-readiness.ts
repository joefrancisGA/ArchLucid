import type { DiagramReconcileSealedReviewRecordState } from "@/lib/infra-evidence/diagram-reconcile-sealed-review-record";
import type { DiagramReconcileWorkbenchMode } from "@/lib/infra-evidence/diagram-reconcile-workbench-mode";
import { isDiagramReconcileAdvisoryWorkbenchMode } from "@/lib/infra-evidence/diagram-reconcile-workbench-mode";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export type DiagramReconcileStepReadiness = {
  readonly label: string;
  readonly kind: EnterpriseStatusKind;
};

export type DiagramReconcileBlockedReasonDetail = {
  readonly message: string;
  readonly fieldAnchorId: string;
};

export const DIAGRAM_RECONCILE_FIELD_ANCHOR_RUN_ID = "infra-diagram-reconcile-run-id";
export const DIAGRAM_RECONCILE_FIELD_ANCHOR_MERMAID = "infra-diagram-reconcile-mermaid-input";
export const DIAGRAM_RECONCILE_FIELD_ANCHOR_SNAPSHOT = "infra-diagram-reconcile-snapshot-picker";

function isAdvisoryDiagramComparisonPath(workbenchMode: DiagramReconcileWorkbenchMode): boolean {
  return isDiagramReconcileAdvisoryWorkbenchMode(workbenchMode);
}

export function resolveDiagramReconcileDiagramSourceStepReadiness(input: {
  readonly workbenchMode: DiagramReconcileWorkbenchMode;
  readonly sealedRecord: DiagramReconcileSealedReviewRecordState;
  readonly modelNodeCount: number | null;
  readonly loadingModel: boolean;
  readonly mermaidDraft: string;
}): DiagramReconcileStepReadiness {
  if (input.loadingModel) {
    return { label: "Loading model", kind: "in-progress" };
  }

  if (isAdvisoryDiagramComparisonPath(input.workbenchMode)) {
    if (input.modelNodeCount != null && input.modelNodeCount > 0) {
      return { label: "Model ready", kind: "ready" };
    }

    if (input.mermaidDraft.trim().length > 0) {
      return { label: "Draft ready to compare", kind: "ready" };
    }

    return { label: "Needs diagram source", kind: "needs-attention" };
  }

  if (input.sealedRecord.kind === "loading") {
    return { label: "Verifying record", kind: "in-progress" };
  }

  if (
    input.sealedRecord.kind === "not-found"
    || input.sealedRecord.kind === "blocked"
    || input.sealedRecord.kind === "invalid-id"
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
  readonly knownSnapshotIds?: readonly string[];
}): DiagramReconcileStepReadiness {
  const selectedId = input.selectedSnapshotId.trim();

  if (input.loadingSnapshots) {
    const knownIds = input.knownSnapshotIds ?? [];

    if (selectedId.length > 0 && knownIds.includes(selectedId)) {
      return { label: "Snapshot selected", kind: "ready" };
    }

    return { label: "Loading snapshots", kind: "in-progress" };
  }

  if (input.snapshotCount === 0) {
    return { label: "No snapshots", kind: "needs-attention" };
  }

  if (selectedId.length > 0) {
    return { label: "Snapshot selected", kind: "ready" };
  }

  return { label: "Needs snapshot", kind: "needs-attention" };
}

export function resolveDiagramReconcileReconcileStepReadiness(input: {
  readonly workbenchMode: DiagramReconcileWorkbenchMode;
  readonly sealedRecord: DiagramReconcileSealedReviewRecordState;
  readonly selectedSnapshotId: string;
  readonly modelNodeCount: number | null;
  readonly mermaidDraft: string;
  readonly reconciliationSaved: boolean;
  readonly loadingReconciliation: boolean;
}): DiagramReconcileStepReadiness {
  if (input.loadingReconciliation) {
    return { label: "Loading reconciliation", kind: "in-progress" };
  }

  if (input.reconciliationSaved) {
    return { label: "Reconciliation saved", kind: "ready" };
  }

  const hasDiagramSource =
    (input.modelNodeCount != null && input.modelNodeCount > 0)
    || input.mermaidDraft.trim().length > 0;

  if (
    isAdvisoryDiagramComparisonPath(input.workbenchMode)
    && input.selectedSnapshotId.trim().length > 0
    && hasDiagramSource
  ) {
    return { label: "Ready to compare", kind: "ready" };
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

  const blocked = resolveDiagramReconcileBlockedReasonDetail({
    workbenchMode: input.workbenchMode,
    sealedRecord: input.sealedRecord,
    selectedSnapshotId: input.selectedSnapshotId,
    modelNodeCount: input.modelNodeCount,
    mermaidDraft: input.mermaidDraft,
  });

  if (blocked != null) {
    return { label: blocked.message, kind: "needs-attention" };
  }

  return { label: "Needs prerequisites", kind: "needs-attention" };
}

export function resolveDiagramReconcileBlockedReasonDetail(input: {
  readonly workbenchMode: DiagramReconcileWorkbenchMode;
  readonly sealedRecord: DiagramReconcileSealedReviewRecordState;
  readonly selectedSnapshotId: string;
  readonly modelNodeCount: number | null;
  readonly mermaidDraft: string;
}): DiagramReconcileBlockedReasonDetail | null {
  if (isAdvisoryDiagramComparisonPath(input.workbenchMode)) {
    if (input.selectedSnapshotId.trim().length === 0) {
      return {
        message: "Select an inventory snapshot in step 2.",
        fieldAnchorId: DIAGRAM_RECONCILE_FIELD_ANCHOR_SNAPSHOT,
      };
    }

    const hasDiagramSource = input.mermaidDraft.trim().length > 0;

    if (!hasDiagramSource) {
      return {
        message: "Add a Mermaid diagram draft in step 1.",
        fieldAnchorId: DIAGRAM_RECONCILE_FIELD_ANCHOR_MERMAID,
      };
    }

    return null;
  }

  if (input.sealedRecord.kind === "idle") {
    return {
      message: "Enter a sealed review record ID in step 1.",
      fieldAnchorId: DIAGRAM_RECONCILE_FIELD_ANCHOR_RUN_ID,
    };
  }

  if (input.sealedRecord.kind === "invalid-id") {
    return {
      message: "Enter a valid sealed review record ID in step 1.",
      fieldAnchorId: DIAGRAM_RECONCILE_FIELD_ANCHOR_RUN_ID,
    };
  }

  if (input.sealedRecord.kind === "loading") {
    return {
      message: "Verifying sealed review record…",
      fieldAnchorId: DIAGRAM_RECONCILE_FIELD_ANCHOR_RUN_ID,
    };
  }

  if (input.sealedRecord.kind === "not-found") {
    return {
      message: input.sealedRecord.message,
      fieldAnchorId: DIAGRAM_RECONCILE_FIELD_ANCHOR_RUN_ID,
    };
  }

  if (input.sealedRecord.kind === "blocked") {
    return {
      message: input.sealedRecord.message,
      fieldAnchorId: DIAGRAM_RECONCILE_FIELD_ANCHOR_RUN_ID,
    };
  }

  if (input.sealedRecord.kind === "loaded" && !input.sealedRecord.isSealed) {
    return {
      message: "Review record is not sealed — finalize the record before reconciling.",
      fieldAnchorId: DIAGRAM_RECONCILE_FIELD_ANCHOR_RUN_ID,
    };
  }

  if (input.selectedSnapshotId.trim().length === 0) {
    return {
      message: "Select an inventory snapshot in step 2.",
      fieldAnchorId: DIAGRAM_RECONCILE_FIELD_ANCHOR_SNAPSHOT,
    };
  }

  if (input.modelNodeCount == null || input.modelNodeCount <= 0) {
    return {
      message: "Ingest a diagram model on this sealed review record in step 1.",
      fieldAnchorId: DIAGRAM_RECONCILE_FIELD_ANCHOR_MERMAID,
    };
  }

  return null;
}

export function resolveDiagramReconcileBlockedReason(input: {
  readonly workbenchMode: DiagramReconcileWorkbenchMode;
  readonly sealedRecord: DiagramReconcileSealedReviewRecordState;
  readonly selectedSnapshotId: string;
  readonly modelNodeCount: number | null;
  readonly mermaidDraft: string;
}): string | null {
  const detail = resolveDiagramReconcileBlockedReasonDetail(input);

  return detail?.message ?? null;
}

export function isDiagramReconcileAdvisoryComparisonPath(
  workbenchMode: DiagramReconcileWorkbenchMode,
): boolean {
  return isAdvisoryDiagramComparisonPath(workbenchMode);
}

export function resolveDiagramReconcileDiagramSourceActionReadiness(input: {
  readonly workbenchMode: DiagramReconcileWorkbenchMode;
  readonly validRunId: boolean;
  readonly mutationsAllowed: boolean;
  readonly validMermaidInput: boolean;
  readonly ingestBusy: boolean;
  readonly loadingModel: boolean;
}): string | null {
  if (isDiagramReconcileAdvisoryWorkbenchMode(input.workbenchMode)) {
    return "Ingest is available only on a sealed review record.";
  }

  if (input.ingestBusy) {
    return "Ingest in progress…";
  }

  if (!input.validRunId) {
    return "Enter a valid sealed review record ID.";
  }

  if (!input.mutationsAllowed) {
    return "Review record must be sealed before ingesting a diagram.";
  }

  if (!input.validMermaidInput) {
    return "Add Mermaid diagram content before ingesting.";
  }

  if (input.loadingModel) {
    return "Loading existing diagram model…";
  }

  return null;
}
