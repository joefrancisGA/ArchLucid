/**
 * Buyer-facing finalize consequence preview (TB-2224).
 * What locks, what stays editable, and what exports unlock - architecture package nouns.
 */

import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

export const FINALIZE_CONSEQUENCE_PREVIEW_TITLE = "What finalizing does" as const;

/** Shared with Finalize review controls - replay/compare stay available post-finalize. */
export const FINALIZE_REPLAY_COMPARE_NOTE =
  "Replay and comparison remain available after finalizing." as const;

export type FinalizeConsequencePreviewRowId = "locks" | "staysEditable" | "exportsUnlock";

export type FinalizeConsequencePreviewRow = {
  readonly id: FinalizeConsequencePreviewRowId;
  readonly label: string;
  readonly detail: string;
};

export type FinalizeConsequencePreview = {
  readonly title: string;
  readonly summary: string;
  readonly rows: readonly FinalizeConsequencePreviewRow[];
  readonly replayNote: string;
};

const ROW_IDS: readonly FinalizeConsequencePreviewRowId[] = [
  "locks",
  "staysEditable",
  "exportsUnlock",
] as const;

/** Stable consequence matrix for the Finalize confirm dialog. */
export function buildFinalizeConsequencePreview(): FinalizeConsequencePreview {
  const signedReviewRecord = BUYER_SURFACE_VOCABULARY.signedReviewRecord;

  return {
    title: FINALIZE_CONSEQUENCE_PREVIEW_TITLE,
    summary: `Finalizing locks this architecture package as a ${signedReviewRecord.toLowerCase()}.`,
    rows: [
      {
        id: "locks",
        label: "What locks",
        detail: `The reviewed architecture snapshot and decision traces become the ${signedReviewRecord.toLowerCase()} for this package.`,
      },
      {
        id: "staysEditable",
        label: "What stays editable",
        detail:
          "Finding dispositions, comments, and governance follow-ups stay editable. Replay and comparison remain available.",
      },
      {
        id: "exportsUnlock",
        label: "What exports unlock",
        detail:
          "Sponsor handoff, deliverable exports, and audit-ready packages unlock for this architecture package.",
      },
    ],
    replayNote: FINALIZE_REPLAY_COMPARE_NOTE,
  };
}

export function finalizeConsequencePreviewRowById(
  id: FinalizeConsequencePreviewRowId,
): FinalizeConsequencePreviewRow {
  const preview = buildFinalizeConsequencePreview();
  const row = preview.rows.find((candidate) => candidate.id === id);

  if (row === undefined) {
    throw new Error(`Missing finalize consequence preview row: ${id}`);
  }

  return row;
}

/** Guard for tests - matrix must cover every declared row id exactly once. */
export function assertFinalizeConsequencePreviewMatrixComplete(): void {
  const ids = buildFinalizeConsequencePreview().rows.map((row) => row.id);

  for (const expected of ROW_IDS) {
    if (!ids.includes(expected)) {
      throw new Error(`Finalize consequence preview matrix missing row: ${expected}`);
    }
  }

  if (ids.length !== ROW_IDS.length) {
    throw new Error("Finalize consequence preview matrix has unexpected row count.");
  }
}
