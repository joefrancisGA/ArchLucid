import type { Dispatch, SetStateAction } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { EvolutionPlanSnapshot } from "@/lib/evolution-plan-snapshot";
import type {
  ImpactPreviewBaselineOption,
  ImpactPreviewComparisonScope,
} from "@/lib/impact-preview-page-types";
import type { ImpactPreviewLastBaselinePair } from "@/lib/impact-preview/impact-preview-last-baseline-pair-storage";
import type { EvolutionCandidateChangeSetResponse, EvolutionResultsResponse } from "@/types/evolution";

export type EvolutionReviewPageViewModel = {
  readonly isDemo: boolean;
  readonly candidates: EvolutionCandidateChangeSetResponse[];
  readonly selectedId: string | null;
  readonly setSelectedId: Dispatch<SetStateAction<string | null>>;
  readonly selectedBaselineId: string | null;
  readonly setSelectedBaselineId: Dispatch<SetStateAction<string | null>>;
  readonly baselineOptions: readonly ImpactPreviewBaselineOption[];
  readonly comparisonScope: ImpactPreviewComparisonScope;
  readonly toggleComparisonScope: (key: keyof ImpactPreviewComparisonScope) => void;
  readonly detail: EvolutionResultsResponse | null;
  readonly listLoading: boolean;
  readonly detailLoading: boolean;
  readonly simulateBusy: boolean;
  readonly listFailure: ApiLoadFailureState | null;
  readonly detailFailure: ApiLoadFailureState | null;
  readonly simulateFailure: ApiLoadFailureState | null;
  readonly loadList: () => Promise<void>;
  readonly loadDetail: () => Promise<void>;
  readonly onSimulate: () => Promise<void>;
  readonly planSnapshot: EvolutionPlanSnapshot | null;
  readonly lastRefreshedAt: Date | null;
  readonly continueLastPair: ImpactPreviewLastBaselinePair | null;
  readonly resumeContinueLastPair: (pair: ImpactPreviewLastBaselinePair) => void;
  readonly rememberBaselinePair: (baselineRunId: string | null, candidateRunId: string | null) => void;
};
