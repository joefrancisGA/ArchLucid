import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { fetchEvolutionCandidates, fetchEvolutionResults } from "@/lib/api";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import type { EvolutionCandidateChangeSetResponse, EvolutionResultsResponse } from "@/types/evolution";

export type EvolutionReviewDemoLoad = {
  readonly mode: "demo";
};

export type EvolutionReviewLiveLoad = {
  readonly mode: "live";
  readonly candidates: EvolutionCandidateChangeSetResponse[];
  readonly selectedId: string | null;
  readonly detail: EvolutionResultsResponse | null;
  readonly listFailure: ApiLoadFailureState | null;
  readonly detailFailure: ApiLoadFailureState | null;
};

export type EvolutionReviewPageServerLoad = EvolutionReviewDemoLoad | EvolutionReviewLiveLoad;

export type EvolutionReviewPageLoadOptions = {
  /** When known (deep-link), list + detail fetch in parallel instead of list→detail waterfall. */
  readonly candidateId?: string | null;
};

/** Lists candidates and first-row (or deep-linked) simulation detail on the server in live mode. */
export async function loadEvolutionReviewPageData(
  options?: EvolutionReviewPageLoadOptions,
): Promise<EvolutionReviewPageServerLoad> {
  const isDemo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  if (isDemo) {
    return { mode: "demo" };
  }

  const preferredCandidateId = options?.candidateId?.trim() ?? "";

  // Deep-link: both endpoints are independent — collapse the list→detail waterfall.
  if (preferredCandidateId.length > 0) {
    return loadEvolutionReviewWithKnownCandidate(preferredCandidateId);
  }

  try {
    const body = await fetchEvolutionCandidates(100);
    const rows = body.candidates ?? [];
    const selectedId = rows.length > 0 ? rows[0].candidateChangeSetId : null;

    if (selectedId === null || selectedId === "") {
      return {
        mode: "live",
        candidates: rows,
        selectedId: null,
        detail: null,
        listFailure: null,
        detailFailure: null,
      };
    }

    try {
      const detail = await fetchEvolutionResults(selectedId);

      return {
        mode: "live",
        candidates: rows,
        selectedId,
        detail,
        listFailure: null,
        detailFailure: null,
      };
    } catch (e: unknown) {
      return {
        mode: "live",
        candidates: rows,
        selectedId,
        detail: null,
        listFailure: null,
        detailFailure: toApiLoadFailure(e),
      };
    }
  } catch (e: unknown) {
    return {
      mode: "live",
      candidates: [],
      selectedId: null,
      detail: null,
      listFailure: toApiLoadFailure(e),
      detailFailure: null,
    };
  }
}

async function loadEvolutionReviewWithKnownCandidate(
  candidateId: string,
): Promise<EvolutionReviewLiveLoad> {
  const [listOutcome, detailOutcome] = await Promise.all([
    fetchEvolutionCandidates(100)
      .then((body) => ({ ok: true as const, body }))
      .catch((e: unknown) => ({ ok: false as const, error: e })),
    fetchEvolutionResults(candidateId)
      .then((detail) => ({ ok: true as const, detail }))
      .catch((e: unknown) => ({ ok: false as const, error: e })),
  ]);

  if (!listOutcome.ok) {
    return {
      mode: "live",
      candidates: [],
      selectedId: candidateId,
      detail: detailOutcome.ok ? detailOutcome.detail : null,
      listFailure: toApiLoadFailure(listOutcome.error),
      detailFailure: detailOutcome.ok ? null : toApiLoadFailure(detailOutcome.error),
    };
  }

  const rows = listOutcome.body.candidates ?? [];

  return {
    mode: "live",
    candidates: rows,
    selectedId: candidateId,
    detail: detailOutcome.ok ? detailOutcome.detail : null,
    listFailure: null,
    detailFailure: detailOutcome.ok ? null : toApiLoadFailure(detailOutcome.error),
  };
}
