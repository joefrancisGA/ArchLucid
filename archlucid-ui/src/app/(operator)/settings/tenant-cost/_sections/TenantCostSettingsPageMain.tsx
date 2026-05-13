"use client";

import { TenantCostSettingsPageView } from "./TenantCostSettingsPageView";
import { useTenantCostSettingsPage } from "./use-tenant-cost-settings-page";

export function TenantCostSettingsPageMain() {
  const model = useTenantCostSettingsPage();

  return <TenantCostSettingsPageView model={model} />;
}
