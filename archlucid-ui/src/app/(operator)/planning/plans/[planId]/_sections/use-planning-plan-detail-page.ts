"use client";

import { useCallback, useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { fetchLearningPlanDetail } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { LearningPlanDetailResponse } from "@/types/learning";

import { resolvePlanIdFromRouteParam } from "./resolve-plan-id-from-params";

export type UsePlanningPlanDetailPageModel = {
  failure: ApiLoadFailureState | null;
  loading: boolean;
  plan: LearningPlanDetailResponse | null;
  planId: string;
};

export function usePlanningPlanDetailPage(): UsePlanningPlanDetailPageModel {
  const params = useParams();
  const planIdRaw = params.planId;
  const planId = resolvePlanIdFromRouteParam(planIdRaw);

  const [plan, setPlan] = useState<LearningPlanDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  const load = useCallback(async () => {
    if (!planId.trim()) {
      return;
    }

    setLoading(true);
    setFailure(null);

    try {
      const detail = await fetchLearningPlanDetail(planId);
      setPlan(detail);
    } catch (e: unknown) {
      setFailure(toApiLoadFailure(e));
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    failure,
    loading,
    plan,
    planId,
  };
}
