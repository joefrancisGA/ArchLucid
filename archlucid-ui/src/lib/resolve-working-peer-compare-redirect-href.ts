import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import {
  ARCHITECTURES_LIST_PATH,
  architectureNestedComparePath,
} from "@/lib/architecture/architecture-routes";
import { comparePageHrefOnBase } from "@/lib/resolve-working-desk-tool-href";
import { readCompareRunIdsFromSearchParams } from "@/lib/compare-url-query-params";

export type ResolveWorkingPeerCompareRedirectHrefInput = {
  readonly pathname: string;
  readonly search?: string | null;
  readonly lastOpenArchitectureId?: string | null;
  readonly queryArchitectureId?: string | null;
};

/**
 * Working peer Compare → nested Compare when architecture is known (ADR 0079 / SY-39).
 * Returns null when no redirect applies (Guided, already nested, or unscoped with no architecture).
 */
export function resolveWorkingPeerCompareRedirectHref(
  input: ResolveWorkingPeerCompareRedirectHrefInput,
): string | null {
  const path = input.pathname.split("?")[0] ?? "";

  if (path !== COMPARE_TWO_REVIEWS_PATH) {
    return null;
  }

  const architectureId =
    input.queryArchitectureId?.trim() ||
    input.lastOpenArchitectureId?.trim() ||
    "";

  if (architectureId.length === 0) {
    const search = input.search?.trim() ?? "";

    return search.length > 0
      ? `${ARCHITECTURES_LIST_PATH}${search.startsWith("?") ? search : `?${search}`}`
      : ARCHITECTURES_LIST_PATH;
  }

  const nestedBase = architectureNestedComparePath(architectureId);
  const search = input.search?.trim() ?? "";

  if (search.length === 0) {
    return nestedBase;
  }

  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const { prior, later } = readCompareRunIdsFromSearchParams(params);

  if (prior.length > 0) {
    return comparePageHrefOnBase(nestedBase, prior, later.length > 0 ? later : null);
  }

  const normalizedSearch = search.startsWith("?") ? search : `?${search}`;

  return `${nestedBase}${normalizedSearch}`;
}
