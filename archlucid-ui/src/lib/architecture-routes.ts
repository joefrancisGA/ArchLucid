/** Architecture draft list. */
export const ARCHITECTURES_LIST_PATH = "/architecture/architectures" as const;

/** Bootstrap a new architecture draft (client redirect to `/architecture/architectures/{id}`). */
export const ARCHITECTURES_NEW_PATH = "/architecture/architectures/new" as const;

/** Architecture reviews list (hub). */
export const REVIEWS_LIST_PATH = "/architecture/reviews" as const;

/** Legacy top-level reviews path — permanent redirect to {@link REVIEWS_LIST_PATH}. */
export const LEGACY_REVIEWS_LIST_PATH = "/reviews" as const;

/** Left-nav Reviews destination — scoped to the default project. */
export const REVIEWS_LIST_NAV_HREF = "/architecture/reviews?projectId=default" as const;

/** Review intake for an existing architecture or submitted material. */
export const REVIEWS_NEW_PATH = "/architecture/reviews/new" as const;

export const REVIEWS_NEW_GUIDED_INTAKE_HREF = "/architecture/reviews/new?path=guided-intake" as const;

export const SOURCE_ARCHITECTURE_QUERY_PARAM = "sourceArchitectureId" as const;

export function architectureDraftPath(architectureId: string): string {
  return `${ARCHITECTURES_LIST_PATH}/${encodeURIComponent(architectureId)}`;
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

  const segment = pathname.slice(prefix.length).split("/")[0]?.trim() ?? "";

  if (segment.length === 0 || segment === "new") {
    return null;
  }

  return segment;
}
