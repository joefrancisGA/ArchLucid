"use client";

import { PilotValueReportPageView } from "./PilotValueReportPageView";
import { usePilotValueReportPilotPage } from "./use-pilot-value-report-pilot-page";

export function PilotValueReportPageMain() {
  const model = usePilotValueReportPilotPage();

  return <PilotValueReportPageView model={model} />;
}
