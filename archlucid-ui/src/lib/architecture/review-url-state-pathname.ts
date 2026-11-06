import {
  ARCHITECTURES_LIST_PATH,
  REVIEWS_LIST_PATH,
  resolveArchitectureReviewHref,
} from "@/lib/architecture/architecture-routes";

export type NestedReviewDeskFromPathname = {
  readonly architectureId: string;
  readonly reviewRunId: string;
};

function pathOnly(pathname: string): string {
  const trimmed = pathname.trim();
  const noQuery = trimmed.split("?")[0] ?? "";
  const noHash = noQuery.split("#")[0] ?? "";

  return noHash.trim();
}

/**
 * Parses `/architecture/architectures/{architectureId}/reviews/{runId}` (and nested suffix paths) from a pathname.
 * Returns null for nested start-review (`…/reviews/new`) and non-review desk paths.
 */
export function parseNestedReviewDeskFromPathname(pathname: string): NestedReviewDeskFromPathname | null {
  const path = pathOnly(pathname);
  const architecturesPrefix = `${ARCHITECTURES_LIST_PATH}/`;

  if (!path.startsWith(architecturesPrefix)) {
    return null;
  }

  const rest = path.slice(architecturesPrefix.length);
  const segments = rest.split("/").filter((segment) => segment.length > 0);
  const reviewsIndex = segments.indexOf("reviews");

  if (reviewsIndex < 0 || reviewsIndex + 1 >= segments.length) {
    return null;
  }

  const reviewRunSegment = segments[reviewsIndex + 1];

  if (reviewRunSegment === "new") {
    return null;
  }

  if (reviewsIndex < 1) {
    return null;
  }

  const architectureSegments = segments.slice(0, reviewsIndex);
  const architectureId = architectureSegments
    .map((segment) => decodeURIComponent(segment))
    .join("/")
    .trim();
  const reviewRunId = decodeURIComponent(reviewRunSegment.trim());

  if (architectureId.length === 0 || reviewRunId.length === 0) {
    return null;
  }

  return { architectureId, reviewRunId };
}

/**
 * Parses `/architecture/reviews/{runId}` peer review URLs (and nested suffix paths) from a pathname.
 * Returns null for list, `new` intake, and non-peer paths.
 */
export function parsePeerReviewRunIdFromPathname(pathname: string): string | null {
  const path = pathOnly(pathname);
  const listPrefix = `${REVIEWS_LIST_PATH}/`;

  if (!path.startsWith(listPrefix)) {
    return null;
  }

  const rest = path.slice(listPrefix.length);
  const segments = rest.split("/").filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return null;
  }

  const runSegment = segments[0];

  if (runSegment === "new") {
    return null;
  }

  const runId = decodeURIComponent(runSegment.trim());

  return runId.length > 0 ? runId : null;
}

/**
 * Resolves the pathname used for router.replace / query-param sync on review surfaces.
 * When the current route is a Working nested review desk, persists nested hrefs; otherwise peer + desk continuity stays peer.
 */
export function resolveReviewUrlStatePathname(
  pathname: string | null | undefined,
  runId: string,
): string {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return resolveArchitectureReviewHref("", null);
  }

  const path = pathname?.trim() ?? "";

  if (path.length === 0) {
    return resolveArchitectureReviewHref(trimmedRunId, null);
  }

  const nestedDesk = parseNestedReviewDeskFromPathname(path);

  if (nestedDesk !== null) {
    return resolveArchitectureReviewHref(trimmedRunId, nestedDesk.architectureId);
  }

  const peerRunId = parsePeerReviewRunIdFromPathname(path);

  if (peerRunId !== null) {
    return resolveArchitectureReviewHref(trimmedRunId, null);
  }

  return resolveArchitectureReviewHref(trimmedRunId, null);
}
