import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import { SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID } from "@/lib/system-not-job-clone-from-snapshot-entry";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_SPAWN_LOCK_HANDOFF_LAYOUT_DOC_ANCHOR =
  "docs/architecture/adrs/0071-working-document-undo-vs-sealed-amend.md" as const;

export type SpawnLockHandoffLayoutInput = {
  readonly handoffEditorLocked: boolean;
  readonly linkedReviewId: string | null;
};

export const SPAWN_LOCK_HANDOFF_LAYOUT_SNAPSHOT_LABELS = {
  architecture: "Architecture",
  businessOutcome: "Business outcome",
  intentSummary: "Intent summary",
} as const;

export const SPAWN_LOCK_HANDOFF_LAYOUT_TEST_IDS = {
  panel: "architecture-draft-handoff-panel",
  snapshotSummary: "architecture-draft-spawn-lock-snapshot-summary",
  cloneControl: SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID,
} as const;

/** SN-013 / LK-04: spawn-locked draft routes render handoff layout instead of a disabled editor form. */
export function shouldRenderSpawnLockedHandoffLayout(input: SpawnLockHandoffLayoutInput): boolean {
  if (input.handoffEditorLocked !== true) {
    return false;
  }

  const linkedReviewId = input.linkedReviewId?.trim() ?? "";

  return linkedReviewId.length > 0;
}

export type SpawnLockHandoffSnapshotSummaryInput = {
  readonly workspaceHeading: string;
  readonly fields: ArchitectureDraftFieldState;
};

/** Read-only snapshot rows shown on spawn-locked handoff surfaces (SN-013). */
export function resolveSpawnLockHandoffSnapshotSummaryRows(
  input: SpawnLockHandoffSnapshotSummaryInput,
): readonly { readonly label: string; readonly value: string; readonly wide?: boolean }[] {
  const businessOutcome = input.fields.businessOutcome.trim();
  const intentSummary = input.fields.freeTextIntent.trim();

  return [
    {
      label: SPAWN_LOCK_HANDOFF_LAYOUT_SNAPSHOT_LABELS.architecture,
      value: input.workspaceHeading.trim().length > 0 ? input.workspaceHeading : "—",
    },
    {
      label: SPAWN_LOCK_HANDOFF_LAYOUT_SNAPSHOT_LABELS.businessOutcome,
      value: businessOutcome.length > 0 ? businessOutcome : "—",
    },
    {
      label: SPAWN_LOCK_HANDOFF_LAYOUT_SNAPSHOT_LABELS.intentSummary,
      value: intentSummary.length > 0 ? intentSummary : "—",
      wide: true,
    },
  ];
}
