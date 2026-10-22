export type LowExtractionConfidenceCountPresentation = {
  readonly known: boolean;
  readonly value: number;
};

export function resolveLowExtractionConfidenceCount(
  raw: number | null | undefined,
): LowExtractionConfidenceCountPresentation {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return { known: false, value: 0 };
  }

  return { known: true, value: Math.max(0, Math.trunc(raw)) };
}

export const LOW_EXTRACTION_CONFIDENCE_COUNT_NOT_LOADED_LABEL =
  "Low-confidence field count not loaded" as const;
