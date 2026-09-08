import { parseArchitectureNestedRoute } from "@/lib/architecture/working-architecture-draft-routes";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import type { ArchitectureIdentityChildReviewSummary } from "@/types/architecture-identity";

export const WORKING_SEARCH_ARCHITECTURE_SCOPE_ALL = "all";

export function isWorkingArchitectureSearchPath(pathname: string): boolean {
  const path = (pathname ?? "").split("?")[0]?.replace(/\/$/, "") ?? "";

  if (path === ARCHITECTURES_LIST_PATH || path === `${ARCHITECTURES_LIST_PATH}/new`) {
    return false;
  }

  const nestedRoute = parseArchitectureNestedRoute(path);

  return nestedRoute !== null;
}

export function resolveWorkingSearchArchitectureIdFromPath(pathname: string): string | null {
  const nestedRoute = parseArchitectureNestedRoute(pathname);

  if (nestedRoute === null) {
    return null;
  }

  const architectureId = nestedRoute.architectureId.trim();

  return architectureId.length > 0 ? architectureId : null;
}

export function scopedArchitectureIdFromWorkingSearchQuery(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim() ?? "";

  if (trimmed.length === 0 || trimmed.toLowerCase() === WORKING_SEARCH_ARCHITECTURE_SCOPE_ALL) {
    return null;
  }

  return trimmed;
}

export function resolveWorkingSearchArchitectureScopeFromUrl(
  raw: string | null | undefined,
  defaultArchitectureId: string | null,
): { readonly architectureId: string | null; readonly explicit: boolean } {
  if (raw === null || raw === undefined || raw.trim().length === 0) {
    return { architectureId: defaultArchitectureId, explicit: false };
  }

  if (raw.trim().toLowerCase() === WORKING_SEARCH_ARCHITECTURE_SCOPE_ALL) {
    return { architectureId: null, explicit: true };
  }

  return { architectureId: raw.trim(), explicit: true };
}

export function buildWorkingArchitectureSearchRunIdSet(
  reviews: readonly ArchitectureIdentityChildReviewSummary[],
): ReadonlySet<string> {
  const runIds = new Set<string>();

  for (const review of reviews) {
    const runId = review.runId.trim();

    if (runId.length > 0) {
      runIds.add(runId);
    }
  }

  return runIds;
}

export function workingSearchArchitectureScopeHrefFromSearch(
  currentSearch: string,
  architectureId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (architectureId === null) {
    params.set("architectureId", WORKING_SEARCH_ARCHITECTURE_SCOPE_ALL);
  } else {
    params.set("architectureId", architectureId);
  }

  const query = params.toString();

  return query.length === 0 ? pathname : `${pathname}?${query}`;
}
