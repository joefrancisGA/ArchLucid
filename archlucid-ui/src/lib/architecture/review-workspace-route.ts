import {
  ARCHITECTURES_LIST_PATH,
  resolveArchitectureReviewHref,
  REVIEWS_LIST_PATH,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture/architecture-routes";
import {
  isReviewDetailTabId,
  REVIEW_DETAIL_FINDING_PARAM,
  REVIEW_DETAIL_TAB_PARAM,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";
import { readUnifiedReviewWorkspaceTabFromSearchParams } from "@/lib/unified-review-workspace-tabs";

export type ParsedReviewWorkspaceRoute = {
  readonly runId: string;
  readonly architectureId: string | null;
  readonly findingId: string | null;
  readonly reviewTab: ReviewDetailTabId | null;
};

export type BuildReviewWorkspaceRouteHrefInput = {
  readonly runId: string;
  readonly architectureId?: string | null;
  readonly reviewTab?: ReviewDetailTabId | null;
  readonly findingId?: string | null;
  /** When true, emit `/findings/{id}` on the path instead of the `findingId` query param. */
  readonly findingIdOnPath?: boolean;
  readonly search?: string | URLSearchParams | null;
  readonly hash?: string | null;
};

const FLAT_REVIEW_PREFIX = `${REVIEWS_LIST_PATH}/`;

function normalizeReviewWorkspacePath(pathname: string): string {
  const withoutQuery = pathname.split("?")[0]?.split("#")[0]?.trim() ?? "";

  if (withoutQuery.length <= 1) {
    return withoutQuery;
  }

  if (withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }

  return withoutQuery;
}

function decodeRouteSegment(segment: string): string {
  try {
    return decodeURIComponent(segment.trim());
  } catch {
    return segment.trim();
  }
}

function parseFlatPeerReviewPath(path: string): Omit<ParsedReviewWorkspaceRoute, "reviewTab"> | null {
  if (path === REVIEWS_NEW_PATH) {
    return null;
  }

  if (!path.startsWith(FLAT_REVIEW_PREFIX)) {
    return null;
  }

  const remainder = path.slice(FLAT_REVIEW_PREFIX.length);
  const segments = remainder.split("/").filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return null;
  }

  const first = decodeRouteSegment(segments[0] ?? "");

  if (first.length === 0) {
    return null;
  }

  if (segments.length >= 3 && segments[1] === "runs") {
    const legacyRunId = decodeRouteSegment(segments[2] ?? "");
    const findingId =
      segments.length >= 5 && segments[3] === "findings"
        ? decodeRouteSegment(segments[4] ?? "")
        : null;

    if (legacyRunId.length === 0) {
      return null;
    }

    return {
      runId: legacyRunId,
      architectureId: null,
      findingId: findingId !== null && findingId.length > 0 ? findingId : null,
    };
  }

  let findingId: string | null = null;
  let runId = first;

  if (segments.length >= 2 && segments[1] === "findings") {
    findingId = decodeRouteSegment(segments[2] ?? "");
    runId = first;
  }

  return {
    runId,
    architectureId: null,
    findingId: findingId !== null && findingId.length > 0 ? findingId : null,
  };
}

function parseNestedReviewPath(path: string): Omit<ParsedReviewWorkspaceRoute, "reviewTab"> | null {
  const prefix = `${ARCHITECTURES_LIST_PATH}/`;

  if (!path.startsWith(prefix)) {
    return null;
  }

  const segments = path
    .slice(prefix.length)
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length < 3 || segments[1] !== "reviews") {
    return null;
  }

  const architectureId = decodeRouteSegment(segments[0] ?? "");
  const runId = decodeRouteSegment(segments[2] ?? "");

  if (architectureId.length === 0 || runId.length === 0) {
    return null;
  }

  let findingId: string | null = null;

  if (segments.length >= 5 && segments[3] === "findings") {
    const parsedFindingId = decodeRouteSegment(segments[4] ?? "");

    if (parsedFindingId.length > 0) {
      findingId = parsedFindingId;
    }
  }

  return {
    runId,
    architectureId,
    findingId,
  };
}

/** Parses flat peer, nested AO-08, and legacy `/reviews/{id}/runs/{runId}` review workspace paths. */
export function parseReviewWorkspaceRoutePath(pathname: string): ParsedReviewWorkspaceRoute | null {
  const path = normalizeReviewWorkspacePath(pathname);
  const nested = path.startsWith(`${ARCHITECTURES_LIST_PATH}/`) ? parseNestedReviewPath(path) : null;
  const parsed = nested ?? parseFlatPeerReviewPath(path);

  if (parsed === null) {
    return null;
  }

  return {
    ...parsed,
    reviewTab: null,
  };
}

/** Parses a review workspace location from a full href (path, query, hash). */
export function parseReviewWorkspaceRouteFromHref(href: string): ParsedReviewWorkspaceRoute | null {
  const trimmed = href.trim();

  if (trimmed.length === 0) {
    return null;
  }

  let pathPart = trimmed;
  let searchPart = "";

  if (trimmed.includes("?")) {
    const splitIndex = trimmed.indexOf("?");
    pathPart = trimmed.slice(0, splitIndex);
    searchPart = trimmed.slice(splitIndex + 1).split("#")[0] ?? "";
  }

  const parsedPath = parseReviewWorkspaceRoutePath(pathPart);

  if (parsedPath === null) {
    return null;
  }

  const params = new URLSearchParams(searchPart.startsWith("?") ? searchPart.slice(1) : searchPart);
  const reviewTabRaw = readUnifiedReviewWorkspaceTabFromSearchParams(params);
  const reviewTab = isReviewDetailTabId(reviewTabRaw) ? reviewTabRaw : null;
  const queryFindingId = params.get(REVIEW_DETAIL_FINDING_PARAM)?.trim() ?? "";
  const findingId =
    parsedPath.findingId
    ?? (queryFindingId.length > 0 ? queryFindingId : null);

  return {
    runId: parsedPath.runId,
    architectureId: parsedPath.architectureId,
    findingId,
    reviewTab,
  };
}

/** Returns the canonical run id for flat, nested, and legacy review desk hrefs. */
export function readReviewWorkspaceRunIdFromHref(href: string): string | null {
  const parsed = parseReviewWorkspaceRouteFromHref(href);

  if (parsed === null) {
    return null;
  }

  const runId = parsed.runId.trim();

  return runId.length > 0 ? runId : null;
}

/** True for review hub, intake, flat peer, nested AO-08 review jobs, and sub-routes (findings, print, …). */
export function isReviewWorkspaceRoutePath(pathname: string): boolean {
  const path = normalizeReviewWorkspacePath(pathname);

  if (path === REVIEWS_LIST_PATH || path === REVIEWS_NEW_PATH) {
    return true;
  }

  return parseReviewWorkspaceRoutePath(path) !== null;
}

/** True when the pathname is a concrete review workspace (not hub or intake). */
export function isReviewWorkspaceDetailRoutePath(pathname: string): boolean {
  return parseReviewWorkspaceRoutePath(pathname) !== null;
}

/** Builds flat or nested review workspace hrefs with optional tab, finding segment, and query. */
export function buildReviewWorkspaceRouteHref(input: BuildReviewWorkspaceRouteHrefInput): string {
  const runId = input.runId.trim();
  const architectureId = input.architectureId?.trim() ?? "";
  let path = resolveArchitectureReviewHref(runId, architectureId.length > 0 ? architectureId : null);
  const findingId = input.findingId?.trim() ?? "";

  if (findingId.length > 0 && input.findingIdOnPath === true) {
    path = `${path}/findings/${encodeURIComponent(findingId)}`;
  }

  const params =
    input.search instanceof URLSearchParams
      ? new URLSearchParams(input.search)
      : new URLSearchParams(input.search ?? "");

  if (input.reviewTab !== undefined && input.reviewTab !== null) {
    params.set(REVIEW_DETAIL_TAB_PARAM, input.reviewTab);
  }

  if (findingId.length > 0 && input.findingIdOnPath !== true) {
    params.set(REVIEW_DETAIL_FINDING_PARAM, findingId);
  }

  const query = params.toString();
  const hash = input.hash?.trim() ?? "";
  const withQuery = query.length > 0 ? `${path}?${query}` : path;

  if (hash.length === 0) {
    return withQuery;
  }

  const normalizedHash = hash.startsWith("#") ? hash : `#${hash}`;

  return `${withQuery}${normalizedHash}`;
}
