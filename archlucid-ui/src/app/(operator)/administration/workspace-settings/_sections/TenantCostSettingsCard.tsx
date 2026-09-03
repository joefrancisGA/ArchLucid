"use client";

import {
  TenantCostSettingsCardShell,
  TenantCostSettingsDemoUnavailableCard,
} from "./TenantCostSettingsCardShell";
import { useTenantCostSettingsForm } from "./use-tenant-cost-settings-form";

type TenantCostSettingsCardProps = {
  readonly canEdit: boolean;
};

/** ROI cost assumptions for estimated USD savings on pilot deltas and sponsor summaries. */
export function TenantCostSettingsCard({ canEdit }: TenantCostSettingsCardProps) {
  const formState = useTenantCostSettingsForm({ canEdit });

  if (formState.demoMode) {
    return <TenantCostSettingsDemoUnavailableCard />;
  }

  return <TenantCostSettingsCardShell {...formState} />;
}
