import type { Dispatch, SetStateAction } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { EvolutionPlanSnapshot } from "@/lib/evolution-plan-snapshot";
import type { EvolutionCandidateChangeSetResponse, EvolutionResultsResponse } from "@/types/evolution";

export type EvolutionReviewPageViewModel = {
  readonly isDemo: boolean;
  readonly candidates: EvolutionCandidateChangeSetResponse[];
  readonly selectedId: string | null;
  readonly setSelectedId: Dispatch<SetStateAction<string | null>>;
  readonly detail: EvolutionResultsResponse | null;
  readonly listLoading: boolean;
  readonly detailLoading: boolean;
  readonly simulateBusy: boolean;
  readonly listFailure: ApiLoadFailureState | null;
  readonly detailFailure: ApiLoadFailureState | null;
  readonly simulateFailure: ApiLoadFailureState | null;
  readonly loadList: () => Promise<void>;
  readonly onSimulate: () => Promise<void>;
  readonly planSnapshot: EvolutionPlanSnapshot | null;
};
