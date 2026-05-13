"use client";

import { PlanningPlanDetailPageView } from "./PlanningPlanDetailPageView";
import { usePlanningPlanDetailPage } from "./use-planning-plan-detail-page";

export function PlanningPlanDetailPageMain() {
  const model = usePlanningPlanDetailPage();

  return <PlanningPlanDetailPageView model={model} />;
}
