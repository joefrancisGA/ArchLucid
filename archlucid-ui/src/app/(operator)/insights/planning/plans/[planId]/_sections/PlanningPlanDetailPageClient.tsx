"use client";

import type { PlanningPlanDetailPageServerLoad } from "./load-planning-plan-detail-page-data";
import { PlanningPlanDetailPageView } from "./PlanningPlanDetailPageView";
import { usePlanningPlanDetailPage } from "./use-planning-plan-detail-page";

type Props = {
  readonly loaded: PlanningPlanDetailPageServerLoad;
};

/** Client shell; plan JSON is loaded in `page.tsx`. */
export function PlanningPlanDetailPageClient(props: Props) {
  const model = usePlanningPlanDetailPage(props.loaded);

  return <PlanningPlanDetailPageView model={model} />;
}
