/**
 * Buyer-facing recycle restore consequence preview (TB-2278).
 * What returns vs what stays distinct — project vs drafts vs architecture packages.
 * Complements TB-2251 (Recycle ≠ Drafts ≠ Package vocabulary rail).
 */

export const RECYCLE_RESTORE_CONSEQUENCE_PREVIEW_TITLE = "What restoring does" as const;

/** Soft-delete honesty — packages and drafts are not erased by project soft-delete. */
export const RECYCLE_RESTORE_DISTINCT_OBJECTS_NOTE =
  "Architecture drafts and architecture packages stay distinct objects from the recycle bin." as const;

export type RecycleRestoreConsequencePreviewRowId =
  | "returns"
  | "staysDistinctDrafts"
  | "staysDistinctPackages";

export type RecycleRestoreConsequencePreviewRow = {
  readonly id: RecycleRestoreConsequencePreviewRowId;
  readonly label: string;
  readonly detail: string;
};

export type RecycleRestoreConsequencePreview = {
  readonly title: string;
  readonly summary: string;
  readonly rows: readonly RecycleRestoreConsequencePreviewRow[];
  readonly distinctObjectsNote: string;
};

const ROW_IDS: readonly RecycleRestoreConsequencePreviewRowId[] = [
  "returns",
  "staysDistinctDrafts",
  "staysDistinctPackages",
] as const;

/** Stable consequence matrix for the Projects recycle bin restore confirm dialog. */
export function buildRecycleRestoreConsequencePreview(): RecycleRestoreConsequencePreview {
  return {
    title: RECYCLE_RESTORE_CONSEQUENCE_PREVIEW_TITLE,
    summary:
      "Restoring returns the soft-deleted project to active projects. It does not invent drafts or architecture packages.",
    rows: [
      {
        id: "returns",
        label: "What returns",
        detail:
          "The project returns to active projects in its workspace (name must not collide with another active project).",
      },
      {
        id: "staysDistinctDrafts",
        label: "What stays distinct — drafts",
        detail:
          "Architecture drafts remain on the drafts registry. Restore does not recreate or erase draft work.",
      },
      {
        id: "staysDistinctPackages",
        label: "What stays distinct — packages",
        detail:
          "Architecture packages and sealed review records stay on the reviews hub. Soft-delete did not erase them; restore does not re-finalize them.",
      },
    ],
    distinctObjectsNote: RECYCLE_RESTORE_DISTINCT_OBJECTS_NOTE,
  };
}

export function recycleRestoreConsequencePreviewRowById(
  id: RecycleRestoreConsequencePreviewRowId,
): RecycleRestoreConsequencePreviewRow {
  const preview = buildRecycleRestoreConsequencePreview();
  const row = preview.rows.find((candidate) => candidate.id === id);

  if (row === undefined) {
    throw new Error(`Missing recycle restore consequence preview row: ${id}`);
  }

  return row;
}

/** Guard for tests - matrix must cover every declared row id exactly once. */
export function assertRecycleRestoreConsequencePreviewMatrixComplete(): void {
  const ids = buildRecycleRestoreConsequencePreview().rows.map((row) => row.id);

  for (const expected of ROW_IDS) {
    if (!ids.includes(expected)) {
      throw new Error(`Recycle restore consequence preview matrix missing row: ${expected}`);
    }
  }

  if (ids.length !== ROW_IDS.length) {
    throw new Error("Recycle restore consequence preview matrix has unexpected row count.");
  }
}
