/** Canonical Pattern library (Insights nav); formerly `/patterns`. */
export const PATTERN_LIBRARY_PATH = "/insights/patterns" as const;

export function patternLibraryDetailPath(patternKey: string): string {
  return `${PATTERN_LIBRARY_PATH}/${encodeURIComponent(patternKey)}`;
}

export function isPatternLibraryPath(pathname: string): boolean {
  return pathname === PATTERN_LIBRARY_PATH || pathname.startsWith(`${PATTERN_LIBRARY_PATH}/`);
}

export function patternLibraryHref(query?: Record<string, string | undefined>): string {
  if (query === undefined) {
    return PATTERN_LIBRARY_PATH;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value.length > 0) {
      params.set(key, value);
    }
  }

  const qs = params.toString();

  return qs.length > 0 ? `${PATTERN_LIBRARY_PATH}?${qs}` : PATTERN_LIBRARY_PATH;
}
