export const IMPACT_PREVIEW_LAST_BASELINE_PAIR_STORAGE_KEY =
  "archlucid_impact_preview_continue_last_pair_v1";

export type ImpactPreviewLastBaselinePair = {
  readonly baselineRunId: string;
  readonly candidateRunId: string;
};

export function readImpactPreviewLastBaselinePair(): ImpactPreviewLastBaselinePair | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(IMPACT_PREVIEW_LAST_BASELINE_PAIR_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as ImpactPreviewLastBaselinePair;
    const baselineRunId = parsed?.baselineRunId?.trim() ?? "";
    const candidateRunId = parsed?.candidateRunId?.trim() ?? "";

    if (baselineRunId.length === 0 || candidateRunId.length === 0) {
      return null;
    }

    return { baselineRunId, candidateRunId };
  } catch {
    return null;
  }
}

export function writeImpactPreviewLastBaselinePair(pair: ImpactPreviewLastBaselinePair): void {
  const baselineRunId = pair.baselineRunId.trim();
  const candidateRunId = pair.candidateRunId.trim();

  if (baselineRunId.length === 0 || candidateRunId.length === 0) {
    return;
  }

  try {
    window.localStorage.setItem(
      IMPACT_PREVIEW_LAST_BASELINE_PAIR_STORAGE_KEY,
      JSON.stringify({ baselineRunId, candidateRunId }),
    );
  } catch {
    /* ignore */
  }
}
