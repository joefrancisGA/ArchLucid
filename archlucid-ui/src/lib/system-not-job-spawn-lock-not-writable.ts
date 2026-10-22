import {
  SYSTEM_NOT_JOB_DUAL_EDITOR_INVENTORY_DOC_PATH,
  SYSTEM_NOT_JOB_DUAL_EDITOR_ROWS,
  type SystemNotJobDualEditorRow,
} from "@/lib/system-not-job-dual-editor-inventory";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_SPAWN_LOCK_NOT_WRITABLE_DOC_ANCHOR =
  "docs/architecture/SYSTEM_NOT_JOB_DUAL_EDITOR_INVENTORY.md" as const;

export const SYSTEM_NOT_JOB_SPAWN_LOCK_NOT_WRITABLE_OWNER = "SN-031" as const;

/** SN-031 ratchet surfaces — spawn-locked draft must not expose writable architecture fields (SN-004). */
export const SYSTEM_NOT_JOB_SPAWN_LOCK_NOT_WRITABLE_SURFACES: readonly string[] = [
  "archlucid-ui/src/components/architecture/ArchitectureDraftFormFields.tsx",
  "archlucid-ui/src/components/architecture/ArchitectureDraftWorkspace.tsx",
  "archlucid-ui/src/components/architecture/ArchitectureDraftWorkspaceBody.tsx",
  "archlucid-ui/src/components/architecture/ArchitectureDraftHandoffPanel.tsx",
  "archlucid-ui/src/hooks/use-architecture-draft-workspace.ts",
  "ArchLucid.Application/Drafts/Stages/DraftRequestMutateStage.cs",
  "ArchLucid.Application/Drafts/DraftRequestStateMachine.cs",
];

/** Visible architecture field test ids that must stay disabled when spawn-locked. */
export const SYSTEM_NOT_JOB_SPAWN_LOCKED_ARCHITECTURE_FIELD_TEST_IDS: readonly string[] = [
  "architecture-draft-system-name",
  "architecture-draft-intent",
  "architecture-draft-outcome",
  "architecture-draft-open-questions-input",
];

export const SYSTEM_NOT_JOB_SPAWN_LOCKED_PATCH_BLOCKED_MESSAGE =
  "is not mutable in status" as const;

/** Inventory rows that must stay locked after spawn (SN-004 one-writer). */
export function listSystemNotJobSpawnLockedDualEditorRows(): readonly SystemNotJobDualEditorRow[] {
  return SYSTEM_NOT_JOB_DUAL_EDITOR_ROWS.filter(
    (row) => row.spawnLocked && row.parallelClass === "locked",
  );
}

export function resolveSystemNotJobSpawnLockedFieldRowsForRatchet(): readonly string[] {
  return listSystemNotJobSpawnLockedDualEditorRows().map((row) => row.field);
}

/** Working spawn-lock uses handoff layout — not a disabled clone of the editor form. */
export function resolveSystemNotJobSpawnLockedWorkingUsesHandoffLayout(): boolean {
  return true;
}

export { SYSTEM_NOT_JOB_DUAL_EDITOR_INVENTORY_DOC_PATH };
