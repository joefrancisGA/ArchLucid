function readNonNegativeInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const normalized = Math.max(0, Math.trunc(value));

    return normalized > 0 ? normalized : null;
  }

  return null;
}

function readNonNegativeIntIncludingZero(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
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

export type JudgeCapReductionFromFindingsSnapshot = {
  readonly configuredCap: number;
  readonly effectiveCap: number;
};

/** Reads configured/effective judge caps when remaining AI budget shrinks the Premium loop (DX-62). */
export function readJudgeCapReductionFromFindingsSnapshot(
  findingsSnapshot: unknown,
): JudgeCapReductionFromFindingsSnapshot | null {
  if (findingsSnapshot === null || typeof findingsSnapshot !== "object") {
    return null;
  }

  const curation = (findingsSnapshot as { insightDensityCuration?: unknown }).insightDensityCuration;

  if (curation === null || typeof curation !== "object") {
    return null;
  }

  const configuredCap = readNonNegativeIntIncludingZero(
    (curation as { judgeConfiguredCap?: unknown }).judgeConfiguredCap,
  );
  const effectiveCap = readNonNegativeIntIncludingZero(
    (curation as { judgeEffectiveCap?: unknown }).judgeEffectiveCap,
  );

  if (configuredCap === null || effectiveCap === null || effectiveCap >= configuredCap) {
    return null;
  }

  return { configuredCap, effectiveCap };
}

export function formatJudgeCapReductionClause(reduction: JudgeCapReductionFromFindingsSnapshot): string {
  return `Premium judge cap reduced from ${reduction.configuredCap} to ${reduction.effectiveCap} from remaining AI budget.`;
}
