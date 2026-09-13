/**
 * Favorite / pinned architecture packages - persisted per browser (TB-2206).
 * Distinct from nav route pins (`nav-pinned-links.ts`).
 */

export const FAVORITE_REVIEWS_STORAGE_KEY = "archlucid.favoriteReviews.v1";

export const FAVORITE_REVIEWS_MAX = 20;

export type FavoriteReview = {
  readonly runId: string;
  readonly title?: string;
  readonly pinnedAt: string;
  /** IR-011 — architecture identity when known on Working. */
  readonly architectureId?: string;
};

function normalizeRunId(runId: string): string {
  return runId.trim();
}

function normalizeArchitectureId(architectureId?: string | null): string | undefined {
  const trimmed = architectureId?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : undefined;
}

function isFavoriteReviewRow(row: unknown): row is FavoriteReview {
  if (row === null || typeof row !== "object") {
    return false;
  }

  const candidate = row as {
    runId?: unknown;
    title?: unknown;
    pinnedAt?: unknown;
    architectureId?: unknown;
  };

  if (typeof candidate.runId !== "string" || normalizeRunId(candidate.runId).length === 0) {
    return false;
  }

  if (typeof candidate.pinnedAt !== "string" || candidate.pinnedAt.trim().length === 0) {
    return false;
  }

  if (candidate.title !== undefined && typeof candidate.title !== "string") {
    return false;
  }

  if (candidate.architectureId !== undefined && typeof candidate.architectureId !== "string") {
    return false;
  }

  return true;
}

function normalizeFavorite(row: FavoriteReview): FavoriteReview {
  const runId = normalizeRunId(row.runId);
  const pinnedAt = row.pinnedAt.trim();
  const title =
    row.title !== undefined && row.title.trim().length > 0 ? row.title.trim() : undefined;
  const architectureId = normalizeArchitectureId(row.architectureId);

  if (title === undefined && architectureId === undefined) {
    return { runId, pinnedAt };
  }

  if (title === undefined) {
    return { runId, pinnedAt, architectureId };
  }

  if (architectureId === undefined) {
    return { runId, title, pinnedAt };
  }

  return { runId, title, pinnedAt, architectureId };
}

/** Reads favorites from localStorage (newest pin first). */
export function listFavoriteReviews(): FavoriteReview[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FAVORITE_REVIEWS_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isFavoriteReviewRow)
      .map(normalizeFavorite)
      .slice(0, FAVORITE_REVIEWS_MAX);
  } catch {
    return [];
  }
}

export function writeFavoriteReviews(favorites: readonly FavoriteReview[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const normalized = favorites
      .filter(isFavoriteReviewRow)
      .map(normalizeFavorite)
      .slice(0, FAVORITE_REVIEWS_MAX);

    window.localStorage.setItem(FAVORITE_REVIEWS_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    /* ignore quota / private mode */
  }
}

export function isFavoriteReview(favorites: readonly FavoriteReview[], runId: string): boolean {
  const normalized = normalizeRunId(runId);

  if (normalized.length === 0) {
    return false;
  }

  return favorites.some((row) => row.runId === normalized);
}

export function addFavoriteReview(
  current: readonly FavoriteReview[],
  entry: {
    readonly runId: string;
    readonly title?: string;
    readonly pinnedAt?: string;
    readonly architectureId?: string | null;
  },
): FavoriteReview[] {
  const runId = normalizeRunId(entry.runId);

  if (runId.length === 0) {
    return [...current].slice(0, FAVORITE_REVIEWS_MAX);
  }

  const without = current.filter((row) => row.runId !== runId);
  const pinnedAt =
    entry.pinnedAt !== undefined && entry.pinnedAt.trim().length > 0
      ? entry.pinnedAt.trim()
      : new Date().toISOString();
  const title =
    entry.title !== undefined && entry.title.trim().length > 0 ? entry.title.trim() : undefined;
  const architectureId = normalizeArchitectureId(entry.architectureId);
  const next: FavoriteReview = normalizeFavorite({
    runId,
    pinnedAt,
    ...(title !== undefined ? { title } : {}),
    ...(architectureId !== undefined ? { architectureId } : {}),
  });

  return [next, ...without].slice(0, FAVORITE_REVIEWS_MAX);
}

export function removeFavoriteReview(
  current: readonly FavoriteReview[],
  runId: string,
): FavoriteReview[] {
  const normalized = normalizeRunId(runId);

  if (normalized.length === 0) {
    return [...current].slice(0, FAVORITE_REVIEWS_MAX);
  }

  return current.filter((row) => row.runId !== normalized).slice(0, FAVORITE_REVIEWS_MAX);
}

export function toggleFavoriteReview(
  current: readonly FavoriteReview[],
  entry: {
    readonly runId: string;
    readonly title?: string;
    readonly pinnedAt?: string;
    readonly architectureId?: string | null;
  },
): FavoriteReview[] {
  if (isFavoriteReview(current, entry.runId)) {
    return removeFavoriteReview(current, entry.runId);
  }

  return addFavoriteReview(current, entry);
}
