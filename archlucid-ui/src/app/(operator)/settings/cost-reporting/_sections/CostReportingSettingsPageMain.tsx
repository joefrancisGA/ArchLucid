"use client";

import { CostReportingSettingsPageView } from "./CostReportingSettingsPageView";
import { useCostReportingSettingsPage } from "./use-cost-reporting-settings-page";

export function CostReportingSettingsPageMain() {
  const model = useCostReportingSettingsPage();

  return <CostReportingSettingsPageView model={model} />;
}
