"use client";

import type { CostReportingSettingsPageServerLoad } from "./load-cost-reporting-settings-page-data";
import { CostReportingSettingsPageView } from "./CostReportingSettingsPageView";
import { AiUsageRouteShellProvider } from "./ai-usage-route-shell-context";
import { useCostReportingSettingsPage } from "./use-cost-reporting-settings-page";

type Props = {
  readonly loaded: CostReportingSettingsPageServerLoad;
};

export function CostReportingSettingsPageClient(props: Props) {
  const model = useCostReportingSettingsPage(props.loaded);

  return (
    <AiUsageRouteShellProvider>
      <CostReportingSettingsPageView model={model} />
    </AiUsageRouteShellProvider>
  );
}
