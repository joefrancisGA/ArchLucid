import type { InfraEvidenceDiffSummary, InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";

export const DRIFT_LAST_COMPARISON_SELECTION_STORAGE_KEY = "archlucid_drift_last_comparison_selection_v1";

export type DriftLastComparisonSelection = {
  readonly snapshotId: string;
  readonly diffId: string;
  readonly changeId: string;
};

export function readDriftLastComparisonSelection(): DriftLastComparisonSelection | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(DRIFT_LAST_COMPARISON_SELECTION_STORAGE_KEY);

    if (raw == null || raw.trim().length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as DriftLastComparisonSelection;

    return normalizeDriftLastComparisonSelection(parsed);
  } catch {
    return null;
  }
}

export function writeDriftLastComparisonSelection(selection: DriftLastComparisonSelection): void {
  const normalized = normalizeDriftLastComparisonSelection(selection);

  if (normalized == null) {
    return;
  }

  try {
    window.localStorage.setItem(DRIFT_LAST_COMPARISON_SELECTION_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    /* ignore quota / private mode */
  }
}

export function validateDriftLastComparisonSelection(
  selection: DriftLastComparisonSelection,
  snapshots: readonly InfraEvidenceSnapshotSummary[],
  diffs: readonly InfraEvidenceDiffSummary[] = [],
): DriftLastComparisonSelection | null {
  const normalized = normalizeDriftLastComparisonSelection(selection);

  if (normalized == null) {
    return null;
  }

  if (!snapshots.some((snapshot) => snapshot.snapshotId === normalized.snapshotId)) {
    return null;
  }

  if (
    normalized.diffId.length > 0
    && diffs.length > 0
    && !diffs.some((diff) => diff.diffId === normalized.diffId)
  ) {
    return null;
  }

  return normalized;
}

function normalizeDriftLastComparisonSelection(
  selection: DriftLastComparisonSelection | null | undefined,
): DriftLastComparisonSelection | null {
  const snapshotId = selection?.snapshotId?.trim() ?? "";

  if (snapshotId.length === 0) {
    return null;
  }

  return {
    snapshotId,
    diffId: selection?.diffId?.trim() ?? "",
    changeId: selection?.changeId?.trim() ?? "",
  };
}
