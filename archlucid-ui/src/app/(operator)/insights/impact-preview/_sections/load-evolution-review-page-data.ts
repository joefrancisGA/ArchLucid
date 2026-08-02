import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { fetchEvolutionCandidates, fetchEvolutionResults } from "@/lib/api";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
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

/** Lists candidates and first-row simulation detail on the server in live mode (demo short-circuits). */
export async function loadEvolutionReviewPageData(): Promise<EvolutionReviewPageServerLoad> {
  const isDemo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  if (isDemo) {
    return { mode: "demo" };
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
