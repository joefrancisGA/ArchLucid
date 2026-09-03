import type { RunSummary } from "@/types/authority";
import type { PagedResponse } from "@/types/pagination";

import { apiGet } from "./http";

/** Lists recent runs for a project (GET /v1/authority/projects/{id}/reviews). */
export async function listRunsByProject(projectId: string, take = 20): Promise<RunSummary[]> {
  return apiGet<RunSummary[]>(
    `/v1/authority/projects/${encodeURIComponent(projectId)}/reviews?take=${take}`,
  );
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
  const q = new URLSearchParams();
  q.set("take", String(pageSize));
  q.set("cursor", options?.cursor ?? "");

  return apiGet<PagedResponse<RunSummary>>(
    `/v1/authority/projects/${encodeURIComponent(projectId)}/reviews?${q}`,
    options?.scopeHeaders !== undefined ? { scopeHeaders: options.scopeHeaders } : undefined,
  );
}

/**
 * Paged runs across all authority project slugs in the current scope
 * (`GET /v1/authority/reviews` — always keyset `cursor`+`take`, same envelope as project-scoped list).
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
  q.set("take", String(pageSize));
  q.set("cursor", options?.cursor ?? "");

  return apiGet<PagedResponse<RunSummary>>(
    `/v1/authority/reviews?${q}`,
    options?.scopeHeaders !== undefined ? { scopeHeaders: options.scopeHeaders } : undefined,
  );
}
