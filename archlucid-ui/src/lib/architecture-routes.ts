import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture-workflow-intent";

/** Architecture draft list. */
export const ARCHITECTURES_LIST_PATH = "/architectures" as const;

/** Bootstrap a new architecture draft (client redirect to `/architectures/{id}`). */
export const ARCHITECTURES_NEW_PATH = "/architectures/new" as const;

/** Architecture reviews list (hub). */
export const REVIEWS_LIST_PATH = "/reviews" as const;

/** Review intake for an existing architecture or submitted material. */
export const REVIEWS_NEW_PATH = "/reviews/new" as const;

export const REVIEWS_NEW_GUIDED_INTAKE_HREF = "/reviews/new?path=guided-intake" as const;

export const SOURCE_ARCHITECTURE_QUERY_PARAM = "sourceArchitectureId" as const;

/** Legacy create-architecture deep link — redirect only; not canonical. */
export const LEGACY_REVIEWS_NEW_CREATE_ARCHITECTURE_HREF =
  `/reviews/new?path=guided-intake&intent=${CREATE_ARCHITECTURE_INTENT}` as const;

export function architectureDraftPath(architectureId: string): string {
  return `${ARCHITECTURES_LIST_PATH}/${encodeURIComponent(architectureId)}`;
}

export function reviewDetailPath(reviewId: string): string {
  return `${REVIEWS_LIST_PATH}/${encodeURIComponent(reviewId)}`;
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
