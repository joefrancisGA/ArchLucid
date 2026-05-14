"use client";

import type { CostReportingSettingsPageServerLoad } from "./load-cost-reporting-settings-page-data";
import { CostReportingSettingsPageView } from "./CostReportingSettingsPageView";
import { useCostReportingSettingsPage } from "./use-cost-reporting-settings-page";

type Props = {
  readonly loaded: CostReportingSettingsPageServerLoad;
};

export function CostReportingSettingsPageClient(props: Props) {
  const model = useCostReportingSettingsPage(props.loaded);

  return <CostReportingSettingsPageView model={model} />;
}
