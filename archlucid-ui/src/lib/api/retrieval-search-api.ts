import type { RetrievalHit } from "@/app/(operator)/insights/search-review-evidence/_sections/retrieval-hit";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { askBlockedReason } from "@/lib/ask/ask-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { apiGet } from "@/lib/api/http";

export type RetrievalSearchQuery = {
  readonly q: string;
  readonly runId?: string;
};

/** GET /v1/retrieval/search — run-scoped or workspace retrieval hits for review evidence search. */
export async function fetchRetrievalSearchHits(query: RetrievalSearchQuery): Promise<RetrievalHit[]> {
  const params = new URLSearchParams();
  params.set("q", query.q.trim());

  if (query.runId !== undefined && query.runId.trim().length > 0) {
    params.set("runId", query.runId.trim());
  }

  try {
    return await apiGet<RetrievalHit[]>(`/v1/retrieval/search?${params.toString()}`);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = askBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
