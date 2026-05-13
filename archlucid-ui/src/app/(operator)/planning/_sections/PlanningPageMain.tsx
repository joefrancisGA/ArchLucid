"use client";

import { PlanningPageView } from "./PlanningPageView";
import { usePlanningPage } from "./use-planning-page";

export function PlanningPageMain() {
  const model = usePlanningPage();

  return <PlanningPageView model={model} />;
}
