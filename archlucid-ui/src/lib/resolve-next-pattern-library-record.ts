import type { PatternLibraryRecord } from "@/lib/pattern-library-types";

export type PatternLibraryDetailNextPatternTarget = {
  readonly patternKey: string;
  readonly name: string;
  readonly href: string;
};

function patternDetailHref(patternKey: string): string {
  return `/insights/patterns/${encodeURIComponent(patternKey)}`;
}

/** Next pattern in catalog order after the current pattern key. */
export function resolveNextPatternLibraryRecord(
  records: readonly PatternLibraryRecord[],
  currentPatternKey: string,
): PatternLibraryDetailNextPatternTarget | null {
  const normalizedCurrentKey = currentPatternKey.trim();
  const currentIndex = records.findIndex((record) => record.patternKey === normalizedCurrentKey);

  if (currentIndex < 0) {
    return null;
  }

  const nextRecord = records[currentIndex + 1];

  if (nextRecord === undefined) {
    return null;
  }

  return {
    patternKey: nextRecord.patternKey,
    name: nextRecord.name,
    href: patternDetailHref(nextRecord.patternKey),
  };
}
