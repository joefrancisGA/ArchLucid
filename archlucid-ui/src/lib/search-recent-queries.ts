const SEARCH_RECENT_QUERIES_STORAGE_KEY = "archlucid.search-recent-queries.v1";
const MAX_RECENT_QUERIES = 3;

export function readSearchRecentQueries(): readonly string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_RECENT_QUERIES_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      .map((entry) => entry.trim())
      .slice(0, MAX_RECENT_QUERIES);
  } catch {
    return [];
  }
}

export function recordSearchRecentQuery(query: string): readonly string[] {
  const trimmed = query.trim();

  if (trimmed.length === 0 || typeof window === "undefined") {
    return readSearchRecentQueries();
  }

  const withoutDup = readSearchRecentQueries().filter(
    (entry) => entry.toLowerCase() !== trimmed.toLowerCase(),
  );
  const next = [trimmed, ...withoutDup].slice(0, MAX_RECENT_QUERIES);

  try {
    window.localStorage.setItem(SEARCH_RECENT_QUERIES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }

  return next;
}

export function clearSearchRecentQueries(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(SEARCH_RECENT_QUERIES_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}
