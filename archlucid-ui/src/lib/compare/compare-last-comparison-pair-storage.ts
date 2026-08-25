export const COMPARE_LAST_COMPARISON_PAIR_STORAGE_KEY = "archlucid_compare_continue_last_pair_v1";

export type CompareLastComparisonPair = {
  readonly priorRunId: string;
  readonly laterRunId: string;
};

export function readCompareLastComparisonPair(): CompareLastComparisonPair | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(COMPARE_LAST_COMPARISON_PAIR_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return null;
    }

    const parsed = JSON.parse(raw) as CompareLastComparisonPair;
    const priorRunId = parsed?.priorRunId?.trim() ?? "";
    const laterRunId = parsed?.laterRunId?.trim() ?? "";

    if (priorRunId.length === 0 || laterRunId.length === 0) {
      return null;
    }

    return { priorRunId, laterRunId };
  } catch {
    return null;
  }
}

export function writeCompareLastComparisonPair(pair: CompareLastComparisonPair): void {
  const priorRunId = pair.priorRunId.trim();
  const laterRunId = pair.laterRunId.trim();

  if (priorRunId.length === 0 || laterRunId.length === 0) {
    return;
  }

  try {
    window.localStorage.setItem(
      COMPARE_LAST_COMPARISON_PAIR_STORAGE_KEY,
      JSON.stringify({ priorRunId, laterRunId }),
    );
  } catch {
    /* ignore */
  }
}
