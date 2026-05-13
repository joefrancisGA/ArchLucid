import type { Dispatch, SetStateAction } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { LearningPlanListItemResponse, LearningSummaryResponse, LearningThemeResponse } from "@/types/learning";

export type PlanningListSummary = LearningSummaryResponse;

export type PlanningPageViewModel = {
  readonly isDemo: boolean;
  readonly summary: PlanningListSummary | null;
  readonly sortedThemes: LearningThemeResponse[];
  readonly sortedPlans: LearningPlanListItemResponse[];
  readonly themeTitleById: Map<string, string>;
  readonly visiblePlans: LearningPlanListItemResponse[];
  readonly selectedThemeId: string | null;
  readonly setSelectedThemeId: Dispatch<SetStateAction<string | null>>;
  readonly selectedThemeTitle: string | null;
  readonly generatedUtc: string | null;
  readonly loading: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly usedPlanningDemoFallback: boolean;
  readonly load: () => Promise<void>;
  readonly empty: boolean;
};
