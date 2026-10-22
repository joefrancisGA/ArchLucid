"use client";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { LearningPlanDetailResponse, LearningPlanListItemResponse } from "@/types/learning";

import type { PlanningPlanDetailPageServerLoad } from "./load-planning-plan-detail-page-data";

export type UsePlanningPlanDetailPageModel = {
  failure: ApiLoadFailureState | null;
  loading: boolean;
  plan: LearningPlanDetailResponse | null;
  plans: readonly LearningPlanListItemResponse[];
  planId: string;
};

export function usePlanningPlanDetailPage(loaded: PlanningPlanDetailPageServerLoad): UsePlanningPlanDetailPageModel {
  return {
    failure: loaded.failure,
    loading: false,
    plan: loaded.plan,
    plans: loaded.plans,
    planId: loaded.planId,
  };
}
