export type TenantCostSettingsResponse = {
  architectHourlyRateUsd: number;
  averageIncidentCostUsd: number;
  isTenantConfigured: boolean;
  updatedUtc: string | null;
};

export type TenantCostSettingsPutRequest = {
  architectHourlyRateUsd: number;
  averageIncidentCostUsd: number;
};
