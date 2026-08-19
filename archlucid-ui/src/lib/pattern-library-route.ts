/** Canonical Pattern library (Insights nav); formerly `/patterns`. */
export const PATTERN_LIBRARY_PATH = "/insights/patterns" as const;

export function patternLibraryDetailPath(patternKey: string): string {
  return `${PATTERN_LIBRARY_PATH}/${encodeURIComponent(patternKey)}`;
}

export function isPatternLibraryPath(pathname: string): boolean {
  return pathname === PATTERN_LIBRARY_PATH || pathname.startsWith(`${PATTERN_LIBRARY_PATH}/`);
}
