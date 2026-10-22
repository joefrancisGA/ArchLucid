import { OPERATOR_RECENT_VIEWS_STORAGE_KEY, parseStoredRecentViews } from "@/lib/operator/operator-recent-views";
import type { PatternLibraryRecord } from "@/lib/pattern-library-types";

const PATTERN_LIBRARY_DETAIL_PREFIX = "/insights/patterns/";

function patternKeyFromRecentHref(href: string): string | null {
  const path = href.split("?")[0] ?? "";

  if (!path.startsWith(PATTERN_LIBRARY_DETAIL_PREFIX)) {
    return null;
  }

  const remainder = path.slice(PATTERN_LIBRARY_DETAIL_PREFIX.length).trim();

  if (remainder.length === 0 || remainder.includes("/")) {
    return null;
  }

  return remainder;
}

function readRecentPatternKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);

    for (const entry of state.entries) {
      const patternKey = patternKeyFromRecentHref(entry.href);

      if (patternKey !== null) {
        return patternKey;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/** Resolves the pattern record to pin as Continue last viewed on the catalog. */
export function resolveContinueLastPatternLibraryRecord(
  records: readonly PatternLibraryRecord[],
): PatternLibraryRecord | null {
  if (records.length === 0) {
    return null;
  }

  const recentPatternKey = readRecentPatternKey();

  if (recentPatternKey !== null) {
    const recentMatch = records.find((record) => record.patternKey === recentPatternKey);

    if (recentMatch !== undefined) {
      return recentMatch;
    }
  }

  return records[0] ?? null;
}
