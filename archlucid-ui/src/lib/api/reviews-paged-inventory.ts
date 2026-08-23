import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import type { RunSummary } from "@/types/authority";
import type { PagedResponse } from "@/types/pagination";

import {
  listRunsByProjectPaged,
  listRunsInScopePaged,
  shouldListReviewsAcrossProjectSlugs,
} from "./architecture-runs";

/**
 * Paged review inventory for Overview Recent reviews and the Reviews hub.
 * When `projectId` is default/empty, lists every authority project slug in scope (create stores system
 * name as the run project slug). Explicit non-default slugs filter to that project. Falls back to the
 * project-slug list when scope-wide listing is missing on an older API (404).
 */
export async function fetchPagedReviewsInventory(params: {
  readonly projectId: string;
  readonly page: number;
  readonly pageSize: number;
  readonly cursor?: string | null;
  readonly scopeHeaders?: Record<string, string>;
}): Promise<PagedResponse<RunSummary>> {
  const cursor = params.cursor ?? "";
  const scopeOptions =
    params.scopeHeaders !== undefined ? { cursor, scopeHeaders: params.scopeHeaders } : { cursor };

  if (!shouldListReviewsAcrossProjectSlugs(params.projectId)) {
    return listRunsByProjectPaged(params.projectId, params.page, params.pageSize, scopeOptions);
  }

  try {
    return await listRunsInScopePaged(params.page, params.pageSize, scopeOptions);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);

    if (!isApiNotFoundFailure(failure)) {
      throw error;
    }

    return listRunsByProjectPaged(params.projectId, params.page, params.pageSize, scopeOptions);
  }
}
