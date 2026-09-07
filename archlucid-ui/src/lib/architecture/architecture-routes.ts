/** Architecture draft list. */
export const ARCHITECTURES_LIST_PATH = "/architecture/architectures" as const;

/** Query param for opening a draft editor under an architecture identity desk (ADR 0074). */
export const ARCHITECTURE_DRAFT_QUERY_PARAM = "draft" as const;

/** Bootstrap a new architecture draft (client redirect to `/architecture/architectures/{draftId}`). */
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

export function architectureIdentityPath(architectureId: string): string {
  return `${ARCHITECTURES_LIST_PATH}/${encodeURIComponent(architectureId)}`;
}

/** Opens the nested draft editor under a durable architecture identity desk (ADR 0077 / AO-05). */
export function architectureIdentityDraftHref(architectureId: string, draftId: string): string {
  return architectureNestedDraftPath(architectureId, draftId);
}

/** Working nested draft job — ADR 0077 / AO-02. Prefer over legacy {@link architectureDraftPath} on Working. */
export function architectureNestedDraftPath(architectureId: string, draftId: string): string {
  return `${architectureIdentityPath(architectureId)}/drafts/${encodeURIComponent(draftId.trim())}`;
}

/** Draft editor path — segment is a {@link DraftRequestResponse.draftId}, not an architecture identity id. */
export function architectureDraftPath(draftId: string): string {
  return `${ARCHITECTURES_LIST_PATH}/${encodeURIComponent(draftId)}`;
}

export function isArchitectureNewDraftSegment(draftId: string): boolean {
  return draftId.trim() === ARCHITECTURE_NEW_DRAFT_SEGMENT;
}

/** Legacy / Guided peer review URL — do not add new Working call sites (ADR 0077 / AO-02). */
export function reviewDetailPath(reviewId: string): string {
  return `${REVIEWS_LIST_PATH}/${encodeURIComponent(reviewId)}`;
}

/** Working nested review job — ADR 0077 / AO-02. */
export function architectureNestedReviewPath(architectureId: string, reviewId: string): string {
  return `${architectureIdentityPath(architectureId)}/reviews/${encodeURIComponent(reviewId.trim())}`;
}

/**
 * Working uses nested review paths when `architectureId` is known; Guided and unlinked reviews keep the peer URL.
 */
export function resolveArchitectureReviewHref(
  reviewId: string,
  architectureId?: string | null,
): string {
  const trimmedReviewId = reviewId.trim();
  const trimmedArchitectureId = architectureId?.trim() ?? "";

  if (trimmedArchitectureId.length > 0) {
    return architectureNestedReviewPath(trimmedArchitectureId, trimmedReviewId);
  }

  return reviewDetailPath(trimmedReviewId);
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
    [SOURCE_ARCHITECTURE_QUERY_PARAM]: architectureId.trim(),
  });

  return `${REVIEWS_NEW_PATH}?${qs.toString()}`;
}

export function isArchitectureDraftPath(pathname: string): boolean {
  return pathname === ARCHITECTURES_LIST_PATH || pathname.startsWith(`${ARCHITECTURES_LIST_PATH}/`);
}

export function parseArchitectureDraftIdFromPath(pathname: string): string | null {
  const path = pathname.split("?")[0] ?? "";
  const prefix = `${ARCHITECTURES_LIST_PATH}/`;

  if (!path.startsWith(prefix)) {
    return null;
  }

  const segments = path
    .slice(prefix.length)
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length === 0 || segments[0] === ARCHITECTURE_NEW_DRAFT_SEGMENT) {
    return null;
  }

  if (segments.length === 3 && segments[1] === "drafts") {
    return segments[2] ?? null;
  }

  if (segments.length === 1) {
    return segments[0] ?? null;
  }

  return null;
}

/** Reads `?draft=` when the pathname segment is an architecture identity id. */
export function parseArchitectureDraftIdFromSearch(search: string | null | undefined): string | null {
  if (search === null || search === undefined || search.trim().length === 0) {
    return null;
  }

  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const draftId = params.get(ARCHITECTURE_DRAFT_QUERY_PARAM)?.trim() ?? "";

  return draftId.length > 0 ? draftId : null;
}
