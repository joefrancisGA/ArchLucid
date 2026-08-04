import { fetchLearningPlanDetail } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { LearningPlanDetailResponse } from "@/types/learning";

export type PlanningPlanDetailPageServerLoad = {
  readonly planId: string;
  readonly plan: LearningPlanDetailResponse | null;
  readonly failure: ApiLoadFailureState | null;
};

export async function loadPlanningPlanDetailPageData(planIdRaw: string): Promise<PlanningPlanDetailPageServerLoad> {
  const planId = planIdRaw.trim();

  if (planId === "") {
    return { planId, plan: null, failure: null };
  }

  try {
    const plan = await fetchLearningPlanDetail(planId);

    return { planId, plan, failure: null };
  } catch (e: unknown) {
    return { planId, plan: null, failure: toApiLoadFailure(e) };
  }
}
