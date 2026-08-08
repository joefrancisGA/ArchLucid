"use client";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { LearningPlanDetailResponse } from "@/types/learning";

import type { PlanningPlanDetailPageServerLoad } from "./load-planning-plan-detail-page-data";

export type UsePlanningPlanDetailPageModel = {
  failure: ApiLoadFailureState | null;
  loading: boolean;
  plan: LearningPlanDetailResponse | null;
  planId: string;
};

export function usePlanningPlanDetailPage(loaded: PlanningPlanDetailPageServerLoad): UsePlanningPlanDetailPageModel {
  return {
    failure: loaded.failure,
    loading: false,
    plan: loaded.plan,
    planId: loaded.planId,
  };
}
