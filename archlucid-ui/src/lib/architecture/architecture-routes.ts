/** Architecture draft list. */
export const ARCHITECTURES_LIST_PATH = "/architecture/architectures" as const;

/** Bootstrap a new architecture draft (client redirect to draft editor). */
export const ARCHITECTURES_NEW_PATH = "/architecture/architectures/new" as const;

/** Route segment for the unsaved new-draft workspace — not a server draft id. */
export const ARCHITECTURE_NEW_DRAFT_SEGMENT = "new" as const;

/** Architecture reviews list (hub). */
export const REVIEWS_LIST_PATH = "/architecture/reviews" as const;

/** Legacy top-level reviews path — retired bookmark; canonical is {@link REVIEWS_LIST_PATH}. */
export const LEGACY_REVIEWS_LIST_PATH = "/reviews" as const;

/** Legacy runs list bookmark — retired; canonical is {@link REVIEWS_LIST_PATH}. */
export const LEGACY_RUNS_LIST_PATH = "/runs" as const;

/** Retired `/demo` bookmark — canonical CTO demo tour entry (next.config redirect removed, IA batch 4). */
export const LEGACY_DEMO_ENTRY_PATH = "/demo" as const;

export const CTO_DEMO_TOUR_ENTRY_HREF =
  "/architecture/reviews/customer-intake-modernization?ctoDemoTour=1" as const;

/** Left-nav Reviews destination — same as {@link REVIEWS_LIST_PATH}; lists all project slugs in scope server-side. */
export const REVIEWS_LIST_NAV_HREF = REVIEWS_LIST_PATH;

/** Review intake for an existing architecture or submitted material. */
export const REVIEWS_NEW_PATH = "/architecture/reviews/new" as const;

export const REVIEWS_NEW_GUIDED_INTAKE_HREF = "/architecture/reviews/new?path=guided-intake" as const;

export const SOURCE_ARCHITECTURE_QUERY_PARAM = "sourceArchitectureId" as const;

/** Customer-visible architecture identity desk (ADR 0074). */
export function architectureIdentityPath(architectureId: string): string {
  return `${ARCHITECTURES_LIST_PATH}/${encodeURIComponent(architectureId)}`;
}

/** Draft editor nested under its parent architecture identity. */
export function architectureDraftEditorPath(architectureId: string, draftId: string): string {
  return `${architectureIdentityPath(architectureId)}/draft/${encodeURIComponent(draftId)}`;
}

/**
 * Opens a draft when the parent architecture id is not yet known (legacy bookmarks).
 * Prefer {@link architectureDraftEditorPath} when both ids are available.
 */
export function architectureDraftPath(draftId: string): string {
  return `${ARCHITECTURES_LIST_PATH}/${encodeURIComponent(draftId)}`;
}

export function isArchitectureNewDraftSegment(architectureId: string): boolean {
  return architectureId.trim() === ARCHITECTURE_NEW_DRAFT_SEGMENT;
}

export function reviewDetailPath(reviewId: string): string {
  return `${REVIEWS_LIST_PATH}/${encodeURIComponent(reviewId)}`;
}

export function isReviewsListPath(pathname: string): boolean {
  return pathname === REVIEWS_LIST_PATH;
}

export function isReviewsPath(pathname: string): boolean {
  return pathname === REVIEWS_LIST_PATH || pathname.startsWith(`${REVIEWS_LIST_PATH}/`);
}

export function startReviewFromArchitectureHref(architectureId: string): string {
  const qs = new URLSearchParams({
    path: "guided-intake",
    [SOURCE_ARCHITECTURE_QUERY_PARAM]: architectureId,
  });

  return `${REVIEWS_NEW_PATH}?${qs.toString()}`;
}

export function isArchitectureDraftPath(pathname: string): boolean {
  return pathname === ARCHITECTURES_LIST_PATH || pathname.startsWith(`${ARCHITECTURES_LIST_PATH}/`);
}

export function parseArchitectureDraftIdFromPath(pathname: string): string | null {
  const prefix = `${ARCHITECTURES_LIST_PATH}/`;

  if (!pathname.startsWith(prefix)) {
    return null;
  }

  const remainder = pathname.slice(prefix.length);
  const firstSegment = remainder.split("/")[0]?.trim() ?? "";

  if (firstSegment.length === 0 || firstSegment === ARCHITECTURE_NEW_DRAFT_SEGMENT) {
    return null;
  }

  if (remainder.includes("/draft/")) {
    const draftSegment = remainder.split("/draft/")[1]?.split("/")[0]?.trim() ?? "";
    return draftSegment.length > 0 ? draftSegment : null;
  }

  return firstSegment;
}

export function parseArchitectureIdentityIdFromPath(pathname: string): string | null {
  const prefix = `${ARCHITECTURES_LIST_PATH}/`;

  if (!pathname.startsWith(prefix)) {
    return null;
  }

  const remainder = pathname.slice(prefix.length);
  const firstSegment = remainder.split("/")[0]?.trim() ?? "";

  if (firstSegment.length === 0 || firstSegment === ARCHITECTURE_NEW_DRAFT_SEGMENT) {
    return null;
  }

  if (remainder.includes("/draft/")) {
    return firstSegment;
  }

  return firstSegment;
}
