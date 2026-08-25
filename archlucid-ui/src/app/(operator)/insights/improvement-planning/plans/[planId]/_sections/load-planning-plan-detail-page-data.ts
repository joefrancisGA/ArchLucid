import { fetchLearningPlanDetail, fetchLearningPlans } from "@/lib/api/learning-evolution-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { LearningPlanDetailResponse, LearningPlanListItemResponse } from "@/types/learning";

export type PlanningPlanDetailPageServerLoad = {
  readonly planId: string;
  readonly plan: LearningPlanDetailResponse | null;
  readonly plans: readonly LearningPlanListItemResponse[];
  readonly failure: ApiLoadFailureState | null;
};

export async function loadPlanningPlanDetailPageData(planIdRaw: string): Promise<PlanningPlanDetailPageServerLoad> {
  const planId = planIdRaw.trim();

  if (planId === "") {
    return { planId, plan: null, plans: [], failure: null };
  }

  try {
    const [plan, plansResponse] = await Promise.all([fetchLearningPlanDetail(planId), fetchLearningPlans()]);

    return { planId, plan, plans: plansResponse.plans, failure: null };
  } catch (e: unknown) {
    return { planId, plan: null, plans: [], failure: toApiLoadFailure(e) };
  }
}
