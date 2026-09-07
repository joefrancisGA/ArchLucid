function readNonNegativeInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const normalized = Math.max(0, Math.trunc(value));

    return normalized > 0 ? normalized : null;
  }

  return null;
}

/** Reads premium judge cap skips persisted on findings snapshot curation (DX-15). */
export function readJudgeSkippedByCapFromFindingsSnapshot(findingsSnapshot: unknown): number | null {
  if (findingsSnapshot === null || typeof findingsSnapshot !== "object") {
    return null;
  }

  const curation = (findingsSnapshot as { insightDensityCuration?: unknown }).insightDensityCuration;

  if (curation === null || typeof curation !== "object") {
    return null;
  }

  return readNonNegativeInt((curation as { judgeSkippedByCap?: unknown }).judgeSkippedByCap);
}
