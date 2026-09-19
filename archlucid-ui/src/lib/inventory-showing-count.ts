/** Default Working architecture identities hub page size (CA-07 / CA-39). */
export const ARCHITECTURE_IDENTITIES_DEFAULT_PAGE_SIZE = 50;

/** Max page size for architecture identity list queries (CA-07). */
export const ARCHITECTURE_IDENTITIES_MAX_PAGE_SIZE = 200;

/** Default reviews hub page size for Working livelihood desks (DA-07). */
export const REVIEWS_HUB_DEFAULT_PAGE_SIZE = 50;

/** Guided/eval may keep a smaller first page when explicitly requested. */
export const REVIEWS_HUB_GUIDED_DEFAULT_PAGE_SIZE = 20;

export const REVIEWS_HUB_MAX_PAGE_SIZE = 200;

export type InventoryShowingCount = {
  readonly loaded: number;
  readonly total: number;
};

/** True when the visible inventory slice does not represent the full set. */
export function shouldShowInventoryIncompleteness(
  loaded: number,
  total: number,
  hasMore = false,
): boolean {
  if (hasMore) {
    return true;
  }

  if (!Number.isFinite(loaded) || !Number.isFinite(total)) {
    return false;
  }

  const safeLoaded = Math.max(0, Math.trunc(loaded));
  const safeTotal = Math.max(0, Math.trunc(total));

  return safeTotal > safeLoaded;
}

/**
 * Self-describing inventory copy (TB-2152): "Showing {loaded} of {total}".
 * Returns null when the loaded set is complete or counts are unknown.
 */
export function formatInventoryShowingLine(loaded: number, total: number, hasMore = false): string | null {
  if (!shouldShowInventoryIncompleteness(loaded, total, hasMore)) {
    return null;
  }

  const safeLoaded = Math.max(0, Math.trunc(loaded));
  const safeTotal = Math.max(0, Math.trunc(total));

  return `Showing ${safeLoaded} of ${safeTotal}`;
}

/** Page count for offset paging; empty inventories still report one page. */
export function inventoryTotalPageCount(total: number, pageSize: number): number {
  const safeTotal = Math.max(0, Math.trunc(total));
  const safeSize = Math.max(1, Math.trunc(pageSize));

  if (safeTotal <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(safeTotal / safeSize));
}

/**
 * Offset-page copy: "Showing {from}–{to} of {total}".
 * Returns null when the total is unknown or empty.
 */
export function formatInventoryPageRangeLine(page: number, pageSize: number, total: number): string | null {
  if (!Number.isFinite(page) || !Number.isFinite(pageSize) || !Number.isFinite(total)) {
    return null;
  }

  const safeTotal = Math.max(0, Math.trunc(total));

  if (safeTotal <= 0) {
    return null;
  }

  const safeSize = Math.max(1, Math.trunc(pageSize));
  const pageCount = inventoryTotalPageCount(safeTotal, safeSize);
  const safePage = Math.min(pageCount, Math.max(1, Math.trunc(page)));
  const from = (safePage - 1) * safeSize + 1;
  const to = Math.min(safePage * safeSize, safeTotal);

  return `Showing ${from}–${to} of ${safeTotal}`;
}

/** Alternate copy when only a remainder count is known (no fake total). */
export function formatInventoryShowingFirstLine(loaded: number, moreRemaining: number): string | null {
  const safeLoaded = Math.max(0, Math.trunc(loaded));
  const safeMore = Math.max(0, Math.trunc(moreRemaining));

  if (safeMore <= 0) {
    return null;
  }

  return `Showing first ${safeLoaded}. ${safeMore} more`;
}

export function resolveInventoryShowingCount(args: InventoryShowingCount & { readonly hasMore?: boolean }): {
  readonly line: string | null;
  readonly isIncomplete: boolean;
} {
  const line = formatInventoryShowingLine(args.loaded, args.total, args.hasMore);

  return {
    line,
    isIncomplete: line !== null,
  };
}
