"use client";

import {
  TenantCostSettingsCardShell,
  TenantCostSettingsDemoUnavailableCard,
} from "./TenantCostSettingsCardShell";
import { useTenantCostSettingsForm } from "./use-tenant-cost-settings-form";

type TenantCostSettingsCardProps = {
  readonly canEdit: boolean;
  readonly tenantDisplayName: string;
};

/** ROI cost assumptions for estimated USD savings on pilot deltas and sponsor summaries. */
export function TenantCostSettingsCard({ canEdit, tenantDisplayName }: TenantCostSettingsCardProps) {
  const formState = useTenantCostSettingsForm({ canEdit });

  if (formState.demoMode) {
    return <TenantCostSettingsDemoUnavailableCard />;
  }

  return <TenantCostSettingsCardShell {...formState} tenantDisplayName={tenantDisplayName} />;
}
