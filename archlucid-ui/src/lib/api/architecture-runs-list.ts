import type { RunSummary } from "@/types/authority";
import type { PagedResponse } from "@/types/pagination";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { runListBlockedReason } from "@/lib/runs/run-list-blocked-reason";

import { encodeRequiredPathSegment, positiveIntegerOrDefault, recordsOnly } from "./api-boundary-normalization";
import { apiGet } from "./http";

/** Page size used when a caller passes a zero, negative, or non-finite take. */
const DEFAULT_RUN_LIST_TAKE = 20;

function runListTake(take: number): string {
  return String(positiveIntegerOrDefault(take, DEFAULT_RUN_LIST_TAKE));
}

/** Authority keyset cursors are opaque tokens; trim padding so first-page empty matches the reviews hub loader. */
function runListCursor(cursor: string | null | undefined): string {
  return cursor?.trim() ?? "";
}

/** Lists recent runs for a project (GET /v1/authority/projects/{id}/reviews). */
export async function listRunsByProject(projectId: string, take = DEFAULT_RUN_LIST_TAKE): Promise<RunSummary[]> {
  const encodedProjectId = encodeRequiredPathSegment(projectId, "projectId");

  try {
    return recordsOnly<RunSummary>(
      await apiGet<unknown>(`/v1/authority/projects/${encodedProjectId}/reviews?take=${runListTake(take)}`),
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = runListBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/**
 * True when the Reviews hub (and similar inventories) should list every authority project slug in scope.
 * Create maps system name → run project slug, so listing only `default` hides real packages.
 */
export function shouldListReviewsAcrossProjectSlugs(projectId: string | null | undefined): boolean {
  const trimmed = projectId?.trim() ?? "";

  return trimmed.length === 0 || trimmed.toLowerCase() === "default";
}

/**
 * Paged runs for a project (GET — always Authority keyset `cursor`+`take`; do not send page/pageSize).
 * `page` remains in the signature for call-site compatibility; only `pageSize` maps to `take`.
 */
export async function listRunsByProjectPaged(
  projectId: string,
  page: number,
  pageSize: number,
  options?: {
    readonly cursor?: string | null;
    readonly scopeHeaders?: Record<string, string>;
  },
): Promise<PagedResponse<RunSummary>> {
  void page;
  const encodedProjectId = encodeRequiredPathSegment(projectId, "projectId");
  const q = new URLSearchParams();
  q.set("take", runListTake(pageSize));
  q.set("cursor", runListCursor(options?.cursor));

  try {
    return await apiGet<PagedResponse<RunSummary>>(
      `/v1/authority/projects/${encodedProjectId}/reviews?${q}`,
      options?.scopeHeaders !== undefined ? { scopeHeaders: options.scopeHeaders } : undefined,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = runListBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/**
 * Paged runs across all authority project slugs in the current scope
 * (`GET /v1/authority/reviews` — always keyset `cursor`+`take`, same envelope as project-scoped list.
 */
export async function listRunsInScopePaged(
  page: number,
  pageSize: number,
  options?: {
    readonly cursor?: string | null;
    readonly scopeHeaders?: Record<string, string>;
  },
): Promise<PagedResponse<RunSummary>> {
  void page;
  const q = new URLSearchParams();
  q.set("take", runListTake(pageSize));
  q.set("cursor", runListCursor(options?.cursor));

  try {
    return await apiGet<PagedResponse<RunSummary>>(
      `/v1/authority/reviews?${q}`,
      options?.scopeHeaders !== undefined ? { scopeHeaders: options.scopeHeaders } : undefined,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = runListBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}