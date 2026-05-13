"use client";

import { RoiSummaryPageView } from "./RoiSummaryPageView";
import { useRoiSummaryPage } from "./use-roi-summary-page";

export function RoiSummaryPageMain() {
  const model = useRoiSummaryPage();

  return <RoiSummaryPageView model={model} />;
}
